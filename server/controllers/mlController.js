const Menu = require('../models/Menu');
const ModelVersion = require('../models/ModelVersion');
const mlClient = require('../services/mlClient');
const { collectTrainingData, today } = require('../services/mlDataService');
const { generateMenuLocally } = require('../services/localMenuGenerator');
const { stripPredictionMeta } = require('../services/predictionSanitizer');

const getMonday = (d) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff)).toISOString().slice(0, 10);
};

const persistWeeklyMenu = async (weekStartDate, generated) => {
  const base = {
    days: generated.days,
    generatedByMl: true,
    mlMetadata: generated.mlMetadata || {},
  };
  const menu = await Menu.findOneAndUpdate(
    { weekStartDate },
    { weekStartDate, ...base },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return menu;
};

const generateMlMenu = async (req, res, next) => {
  try {
    const payload = await collectTrainingData();
    payload.generation_nonce = Date.now();

    const todayStr = req.body.weekStartDate || today();
    const mondayStr = getMonday(new Date());

    let generated;
    try {
      await mlClient.trainMenu(payload);
      generated = await mlClient.generateMenu(payload);
    } catch (mlErr) {
      console.warn('ML menu service unavailable, using local generator:', mlErr.message);
      generated = generateMenuLocally(payload);
    }

    await persistWeeklyMenu(todayStr, generated);
    if (mondayStr !== todayStr) {
      await persistWeeklyMenu(mondayStr, generated);
    }

    const menu = await Menu.findOne({ weekStartDate: todayStr });

    await ModelVersion.create({
      modelName: 'menu_generator',
      version: Date.now(),
      metrics: {},
      isActive: true,
    });

    res.json({
      success: true,
      menu,
      message: 'Weekly menu generated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

const forecastAttendance = async (_req, res, next) => {
  try {
    const payload = await collectTrainingData();
    try {
      await mlClient.trainAttendance(payload);
      const prediction = await mlClient.predictAttendance(payload);
      res.json({ success: true, prediction: stripPredictionMeta(prediction) });
    } catch (mlErr) {
      console.warn('ML attendance forecast unavailable:', mlErr.message);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const base = Math.max(payload.student_count, 50);
      res.json({
        success: true,
        prediction: {
          date: tomorrow.toISOString().slice(0, 10),
          predictions: {
            breakfast: Math.round(base * 0.65),
            lunch: Math.round(base * 0.85),
            snacks: Math.round(base * 0.45),
            dinner: Math.round(base * 0.8),
          },
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

const forecastIngredientDemand = async (_req, res, next) => {
  try {
    const payload = await collectTrainingData();
    try {
      await mlClient.trainIngredientDemand(payload);
      const prediction = await mlClient.predictIngredientDemand(payload);
      res.json({ success: true, prediction: stripPredictionMeta(prediction) });
    } catch (mlErr) {
      console.warn('ML ingredient forecast unavailable:', mlErr.message);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const att = Math.max(payload.student_count, 50);
      const byMeal = {};
      const mealScale = { breakfast: 0.55, lunch: 1, snacks: 0.35, dinner: 0.9 };
      ['breakfast', 'lunch', 'snacks', 'dinner'].forEach((meal) => {
        const count = Math.round(att * mealScale[meal]);
        byMeal[meal] = (payload.inventory || []).map((inv) => ({
          ingredient: inv.name,
          quantity: Math.round(count * 0.12 * 10) / 10,
          unit: inv.unit || 'kg',
          currentStock: inv.quantity,
          neededAfterStock: Math.max(0, Math.round(count * 0.12 * 10) / 10 - inv.quantity),
        }));
      });
      res.json({
        success: true,
        prediction: { date: tomorrow.toISOString().slice(0, 10), byMeal },
      });
    }
  } catch (error) {
    next(error);
  }
};

const listModelVersions = async (req, res, next) => {
  try {
    const filter = req.query.modelName ? { modelName: req.query.modelName } : {};
    const versions = await ModelVersion.find(filter).sort({ trainedAt: -1 }).limit(20);
    res.json({ success: true, versions });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateMlMenu,
  forecastAttendance,
  forecastIngredientDemand,
  listModelVersions,
};
