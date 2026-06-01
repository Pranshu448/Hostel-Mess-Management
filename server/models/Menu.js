const mongoose = require('mongoose');

const mealNutritionSchema = new mongoose.Schema(
  {
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbohydrates: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 },
  },
  { _id: false }
);

const dayMenuSchema = new mongoose.Schema(
  {
    breakfast: { type: String, default: '' },
    lunch: { type: String, default: '' },
    snacks: { type: String, default: '' },
    dinner: { type: String, default: '' },
    breakfastNutrition: { type: mealNutritionSchema, default: () => ({}) },
    lunchNutrition: { type: mealNutritionSchema, default: () => ({}) },
    snacksNutrition: { type: mealNutritionSchema, default: () => ({}) },
    dinnerNutrition: { type: mealNutritionSchema, default: () => ({}) },
  },
  { _id: false }
);

const menuSchema = new mongoose.Schema(
  {
    weekStartDate: { type: String, required: true }, // YYYY-MM-DD
    generatedByMl: { type: Boolean, default: false },
    mlMetadata: {
      modelVersion: { type: String, default: '' },
      confidence: { type: Number, default: 0 },
      explanation: { type: String, default: '' },
    },
    days: {
      monday: dayMenuSchema,
      tuesday: dayMenuSchema,
      wednesday: dayMenuSchema,
      thursday: dayMenuSchema,
      friday: dayMenuSchema,
      saturday: dayMenuSchema,
      sunday: dayMenuSchema,
    },
  },
  { timestamps: true }
);

menuSchema.index({ weekStartDate: 1 }, { unique: true });

module.exports = mongoose.model('Menu', menuSchema);
