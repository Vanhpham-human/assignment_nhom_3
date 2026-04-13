const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    staff: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    orderDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      required: true,
      enum: ['Pending', 'Completed', 'Cancelled'],
      default: 'Completed',
      index: true
    }
  },
  { timestamps: true }
);

orderSchema.index({ orderDate: -1, status: 1 });
orderSchema.index({ customer: 1, orderDate: -1 });
orderSchema.index({ staff: 1, orderDate: -1 });

module.exports = mongoose.model('Order', orderSchema);
