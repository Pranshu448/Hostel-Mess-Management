const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    quantity: { type: Number, default: 0 },
    unit: { type: String, default: 'kg' },
    purchaseDate: { type: String, default: '' },
    expiryDate: { type: String, default: '' },
    cost: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Inventory', inventorySchema);
