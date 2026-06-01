const mongoose = require('mongoose');

const wasteItemSchema = new mongoose.Schema(
  {
    ingredient: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, default: 'kg' },
  },
  { _id: false }
);

const foodWasteSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    items: [wasteItemSchema],
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

foodWasteSchema.index({ date: 1 }, { unique: true });

module.exports = mongoose.model('FoodWaste', foodWasteSchema);
