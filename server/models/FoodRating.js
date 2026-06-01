const mongoose = require('mongoose');

const foodRatingSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dishName: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
  },
  { timestamps: true }
);

foodRatingSchema.index({ student: 1, dishName: 1 }, { unique: true });

module.exports = mongoose.model('FoodRating', foodRatingSchema);
