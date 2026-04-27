const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    quantity: { type: Number, default: 0 },
    unit: { type: String, default: 'kg' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Inventory', inventorySchema);
