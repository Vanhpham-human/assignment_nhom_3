const Product = require('../models/product.model');
const Order = require('../models/order.model');
const OrderDetail = require('../models/orderDetail.model');

function buildDateFilter(startDate, endDate) {
  const orderDateFilter = {};
  if (startDate) {
    orderDateFilter.$gte = new Date(startDate);
  }
  if (endDate) {
    orderDateFilter.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
  }

  return Object.keys(orderDateFilter).length ? { orderDate: orderDateFilter } : {};
}

async function getOverviewData({ startDate, endDate, groupBy = 'month' }) {
  const dateFilter = buildDateFilter(startDate, endDate);
  const orderMatch = {
    'orderInfo.status': 'Completed',
    ...Object.fromEntries(Object.entries(dateFilter).map(([key, value]) => [`orderInfo.${key}`, value]))
  };

  const groupId =
    groupBy === 'day'
      ? {
          year: { $year: '$orderInfo.orderDate' },
          month: { $month: '$orderInfo.orderDate' },
          day: { $dayOfMonth: '$orderInfo.orderDate' }
        }
      : {
          year: { $year: '$orderInfo.orderDate' },
          month: { $month: '$orderInfo.orderDate' }
        };

  const [revenueByTime, revenueByCategory, netProfitAgg] = await Promise.all([
    OrderDetail.aggregate([
      {
        $lookup: {
          from: 'orders',
          localField: 'order',
          foreignField: '_id',
          as: 'orderInfo'
        }
      },
      { $unwind: '$orderInfo' },
      {
        $match: {
          ...orderMatch
        }
      },
      {
        $group: {
          _id: groupId,
          totalRevenue: { $sum: { $multiply: ['$quantity', '$unitPrice'] } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      {
        $project: {
          _id: 0,
          label:
            groupBy === 'day'
              ? {
                  $concat: [
                    { $toString: '$_id.day' },
                    '/',
                    { $toString: '$_id.month' },
                    '/',
                    { $toString: '$_id.year' }
                  ]
                }
              : {
                  $concat: [
                    { $toString: '$_id.month' },
                    '/',
                    { $toString: '$_id.year' }
                  ]
                },
          totalRevenue: 1
        }
      }
    ]),
    OrderDetail.aggregate([
      {
        $lookup: {
          from: 'orders',
          localField: 'order',
          foreignField: '_id',
          as: 'orderInfo'
        }
      },
      { $unwind: '$orderInfo' },
      { $match: orderMatch },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $group: {
          _id: '$productInfo.category',
          revenue: { $sum: { $multiply: ['$quantity', '$unitPrice'] } }
        }
      },
      { $sort: { revenue: -1 } }
    ]),
    OrderDetail.aggregate([
      {
        $lookup: {
          from: 'orders',
          localField: 'order',
          foreignField: '_id',
          as: 'orderInfo'
        }
      },
      { $unwind: '$orderInfo' },
      { $match: orderMatch },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $multiply: ['$quantity', '$unitPrice'] } },
          totalCost: { $sum: { $multiply: ['$quantity', '$productInfo.costPrice'] } }
        }
      },
      {
        $project: {
          _id: 0,
          totalRevenue: 1,
          totalCost: 1,
          netProfit: { $subtract: ['$totalRevenue', '$totalCost'] }
        }
      }
    ])
  ]);

  return {
    revenueByTime,
    revenueByCategory,
    netProfit: netProfitAgg[0] || { totalRevenue: 0, totalCost: 0, netProfit: 0 }
  };
}

async function getReportData() {
  const [topCustomers, employeePerformance, lowStockProducts] = await Promise.all([
    Order.aggregate([
      { $match: { status: 'Completed' } },
      {
        $lookup: {
          from: 'users',
          localField: 'customer',
          foreignField: '_id',
          as: 'customerInfo'
        }
      },
      { $unwind: '$customerInfo' },
      {
        $lookup: {
          from: 'orderdetails',
          localField: '_id',
          foreignField: 'order',
          as: 'items'
        }
      },
      {
        $addFields: {
          orderTotal: {
            $sum: {
              $map: {
                input: '$items',
                as: 'item',
                in: { $multiply: ['$$item.quantity', '$$item.unitPrice'] }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: '$customerInfo._id',
          name: { $first: '$customerInfo.name' },
          email: { $first: '$customerInfo.email' },
          totalOrders: { $sum: 1 },
          totalPaid: { $sum: '$orderTotal' }
        }
      },
      { $sort: { totalPaid: -1 } },
      { $limit: 10 }
    ]),
    Order.aggregate([
      { $match: { status: 'Completed' } },
      {
        $lookup: {
          from: 'employees',
          localField: 'staff',
          foreignField: '_id',
          as: 'employeeInfo'
        }
      },
      { $unwind: '$employeeInfo' },
      {
        $lookup: {
          from: 'orderdetails',
          localField: '_id',
          foreignField: 'order',
          as: 'items'
        }
      },
      {
        $addFields: {
          orderTotal: {
            $sum: {
              $map: {
                input: '$items',
                as: 'item',
                in: { $multiply: ['$$item.quantity', '$$item.unitPrice'] }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: '$employeeInfo._id',
          code: { $first: '$employeeInfo.code' },
          name: { $first: '$employeeInfo.name' },
          totalOrdersHandled: { $sum: 1 },
          totalRevenue: { $sum: '$orderTotal' }
        }
      },
      {
        $project: {
          code: 1,
          name: 1,
          totalOrdersHandled: 1,
          totalRevenue: 1,
          bonus: { $multiply: ['$totalRevenue', 0.01] }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]),
    Product.find({ stock: { $lt: 10 } }).sort({ stock: 1 }).lean()
  ]);

  return { topCustomers, employeePerformance, lowStockProducts };
}

module.exports = {
  getOverviewData,
  getReportData
};
