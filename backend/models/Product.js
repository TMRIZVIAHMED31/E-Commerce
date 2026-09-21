const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, default: 'general', trim: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    image: { type: String, default: '' },
    images: [{ type: String, default: [] }],
    color: { type: String, default: '' },
    colors: [{ type: String, default: [] }],
    properties: {
      warranty: { type: String, default: '' },
      wattage: { type: String, default: '' },
      capacity: { type: String, default: '' },
      voltage: { type: String, default: '' },
    },
    details: {
      sku: { type: String, default: '' },
      options: { type: String, default: '' },
    },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text', category: 'text' });

module.exports = mongoose.model('Product', productSchema);
