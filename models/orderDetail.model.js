const mongoose = require('mongoose');

const orderDetailSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

orderDetailSchema.index({ order: 1, product: 1 }, { unique: true });
orderDetailSchema.index({ product: 1, order: 1 });

module.exports = mongoose.model('OrderDetail', orderDetailSchema);
