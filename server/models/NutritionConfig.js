const mongoose = require('mongoose');

const nutritionConfigSchema = new mongoose.Schema(
  {
    dailyCalories: { type: Number, default: 2400 },
    protein: { type: Number, default: 80 },
    carbohydrates: { type: Number, default: 320 },
    fat: { type: Number, default: 70 },
    fiber: { type: Number, default: 30 },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('NutritionConfig', nutritionConfigSchema);
