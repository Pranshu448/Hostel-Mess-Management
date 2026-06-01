const mongoose = require('mongoose');

const nutritionSchema = new mongoose.Schema(
  {
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbohydrates: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 },
  },
  { _id: false }
);

const ingredientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    quantityPerServing: { type: Number, default: 0 },
    unit: { type: String, default: 'kg' },
  },
  { _id: false }
);

const dishSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    mealTypes: [{ type: String, enum: ['breakfast', 'lunch', 'snacks', 'dinner'] }],
    nutrition: { type: nutritionSchema, default: () => ({}) },
    ingredients: [ingredientSchema],
    isVegetarian: { type: Boolean, default: true },
    avgRating: { type: Number, default: 3 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Dish', dishSchema);
