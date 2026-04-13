const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    category: { type: String, required: true, trim: true, index: true },
    price: { type: Number, required: true, min: 0, index: true },
    stock: { type: Number, required: true, min: 0, index: true },
    costPrice: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

productSchema.index({ category: 1, stock: 1 });

module.exports = mongoose.model('Product', productSchema);
