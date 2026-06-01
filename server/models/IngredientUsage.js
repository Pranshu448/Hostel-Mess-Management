const mongoose = require('mongoose');

const usageItemSchema = new mongoose.Schema(
  {
    ingredient: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, default: 'kg' },
  },
  { _id: false }
);

const ingredientUsageSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    mealType: { type: String, enum: ['breakfast', 'lunch', 'snacks', 'dinner'], required: true },
    attendanceCount: { type: Number, default: 0 },
    menuItems: [{ type: String }],
    items: [usageItemSchema],
  },
  { timestamps: true }
);

ingredientUsageSchema.index({ date: 1, mealType: 1 });

module.exports = mongoose.model('IngredientUsage', ingredientUsageSchema);
