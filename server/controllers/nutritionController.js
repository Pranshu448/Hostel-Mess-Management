const NutritionConfig = require('../models/NutritionConfig');

const getNutritionConfig = async (_req, res, next) => {
  try {
    let config = await NutritionConfig.findOne().sort({ updatedAt: -1 });
    if (!config) {
      config = await NutritionConfig.create({});
    }
    res.json({ success: true, config });
  } catch (error) {
    next(error);
  }
};

const saveNutritionConfig = async (req, res, next) => {
  try {
    const { dailyCalories, protein, carbohydrates, fat, fiber } = req.body;
    const config = await NutritionConfig.findOneAndUpdate(
      {},
      {
        dailyCalories,
        protein,
        carbohydrates,
        fat,
        fiber,
        updatedBy: req.user.id,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, config });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNutritionConfig, saveNutritionConfig };
