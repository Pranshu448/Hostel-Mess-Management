const FoodRating = require('../models/FoodRating');
const Dish = require('../models/Dish');

const listRatings = async (req, res, next) => {
  try {
    const filter = req.user.role === 'student' ? { student: req.user.id } : {};
    const ratings = await FoodRating.find(filter).sort({ updatedAt: -1 });
    res.json({ success: true, ratings });
  } catch (error) {
    next(error);
  }
};

const listDishesForRating = async (_req, res, next) => {
  try {
    const dishes = await Dish.find().sort({ name: 1 });
    res.json({ success: true, dishes });
  } catch (error) {
    next(error);
  }
};

const submitRating = async (req, res, next) => {
  try {
    const { dishName, rating } = req.body;
    if (!dishName || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'dishName and rating (1-5) required.' });
    }

    const record = await FoodRating.findOneAndUpdate(
      { student: req.user.id, dishName: dishName.trim() },
      { student: req.user.id, dishName: dishName.trim(), rating },
      { upsert: true, new: true }
    );

    const stats = await FoodRating.aggregate([
      { $match: { dishName: dishName.trim() } },
      { $group: { _id: '$dishName', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (stats[0]) {
      await Dish.findOneAndUpdate(
        { name: dishName.trim() },
        { avgRating: Math.round(stats[0].avg * 10) / 10 },
        { upsert: false }
      );
    }

    res.json({ success: true, rating: record });
  } catch (error) {
    next(error);
  }
};

module.exports = { listRatings, listDishesForRating, submitRating };
