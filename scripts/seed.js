const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');

const connectDB = require('../config/db');
const User = require('../models/user.model');
const Employee = require('../models/employee.model');
const Product = require('../models/product.model');
const Order = require('../models/order.model');
const OrderDetail = require('../models/orderDetail.model');

dotenv.config();

const CATEGORY_LIST = [
  'Smartphone',
  'Laptop',
  'Tablet',
  'Smartwatch',
  'Headphone',
  'Keyboard',
  'Mouse',
  'Monitor',
  'Speaker',
  'Accessory'
];

function randomDateWithinRange(start, end) {
  const from = start.getTime();
  const to = end.getTime();
  return new Date(from + Math.random() * (to - from));
}

async function clearData() {
  await Promise.all([
    OrderDetail.deleteMany({}),
    Order.deleteMany({}),
    Product.deleteMany({}),
    Employee.deleteMany({}),
    User.deleteMany({})
  ]);
}

async function seedUsers(count = 500) {
  const docs = Array.from({ length: count }).map(() => ({
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    address: faker.location.streetAddress({ useFullAddress: true }),
    phone: faker.phone.number('0#########')
  }));

  return User.insertMany(docs, { ordered: false });
}

async function seedEmployees(count = 30) {
  const positions = ['Sales', 'Senior Sales', 'Supervisor', 'Manager'];
  const docs = Array.from({ length: count }).map((_, index) => ({
    name: faker.person.fullName(),
    code: `EMP${String(index + 1).padStart(3, '0')}`,
    position: faker.helpers.arrayElement(positions),
    salary: faker.number.int({ min: 9000000, max: 30000000 })
  }));

  return Employee.insertMany(docs, { ordered: false });
}

async function seedProducts(count = 100) {
  const docs = Array.from({ length: count }).map(() => {
    const basePrice = faker.number.int({ min: 500000, max: 60000000 });
    const costPrice = Math.floor(basePrice * faker.number.float({ min: 0.6, max: 0.9, fractionDigits: 2 }));

    return {
      name: faker.commerce.productName(),
      category: faker.helpers.arrayElement(CATEGORY_LIST),
      price: basePrice,
      stock: faker.number.int({ min: 0, max: 200 }),
      costPrice
    };
  });

  return Product.insertMany(docs, { ordered: false });
}

async function seedOrdersAndDetails({ users, employees, products, orderCount = 5000 }) {
  const now = new Date();
  const start = new Date('2025-01-01T00:00:00.000Z');
  const orderBatch = [];
  const productMap = new Map(products.map((product) => [String(product._id), product]));
  const detailInsertBatchSize = 2000;

  for (let i = 0; i < orderCount; i += 1) {
    const status = faker.helpers.weightedArrayElement([
      { weight: 85, value: 'Completed' },
      { weight: 10, value: 'Pending' },
      { weight: 5, value: 'Cancelled' }
    ]);

    orderBatch.push({
      customer: faker.helpers.arrayElement(users)._id,
      staff: faker.helpers.arrayElement(employees)._id,
      orderDate: randomDateWithinRange(start, now),
      status
    });
  }

  const insertedOrders = await Order.insertMany(orderBatch, { ordered: false });

  const details = [];
  let detailCount = 0;
  for (const order of insertedOrders) {
    const itemsCount = faker.number.int({ min: 2, max: 4 });
    const selectedProductIds = new Set();

    while (selectedProductIds.size < itemsCount) {
      selectedProductIds.add(String(faker.helpers.arrayElement(products)._id));
    }

    for (const productId of selectedProductIds) {
      const product = productMap.get(String(productId));
      const priceFluctuation = faker.number.float({ min: 0.95, max: 1.05, fractionDigits: 2 });
      const unitPrice = Math.floor(product.price * priceFluctuation);

      details.push({
        order: order._id,
        product: product._id,
        quantity: faker.number.int({ min: 1, max: 5 }),
        unitPrice
      });
      detailCount += 1;
    }

    if (details.length >= detailInsertBatchSize) {
      await OrderDetail.insertMany(details.splice(0, details.length), { ordered: false });
    }
  }

  if (details.length) {
    await OrderDetail.insertMany(details, { ordered: false });
  }

  return {
    orders: insertedOrders.length,
    orderDetails: detailCount
  };
}

async function run() {
  try {
    await connectDB();
    console.log('Cleaning old data...');
    await clearData();

    console.log('Seeding users...');
    const users = await seedUsers(500);

    console.log('Seeding employees...');
    const employees = await seedEmployees(30);

    console.log('Seeding products...');
    const products = await seedProducts(100);

    console.log('Seeding orders and order details...');
    const result = await seedOrdersAndDetails({ users, employees, products, orderCount: 5000 });

    console.log('Done seeding:');
    console.log(`- Users: ${users.length}`);
    console.log(`- Employees: ${employees.length}`);
    console.log(`- Products: ${products.length}`);
    console.log(`- Orders: ${result.orders}`);
    console.log(`- OrderDetails: ${result.orderDetails}`);
  } catch (error) {
    if (error instanceof mongoose.Error) {
      console.error('Mongoose error:', error.message);
    } else {
      console.error('Seed failed:', error);
    }
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
