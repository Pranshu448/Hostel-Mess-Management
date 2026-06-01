const FoodWaste = require('../models/FoodWaste');
const mlClient = require('../services/mlClient');
const { collectTrainingData } = require('../services/mlDataService');
const { stripPredictionMeta } = require('../services/predictionSanitizer');

const listWaste = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 500;
    const records = await FoodWaste.find().sort({ date: -1 }).limit(limit).lean();
    const history = [];
    records.forEach((rec) => {
      (rec.items || []).forEach((item) => {
        history.push({
          date: rec.date,
          ingredient: item.ingredient,
          quantity: item.quantity,
          unit: item.unit || 'kg',
          notes: rec.notes || '',
          recordId: rec._id,
        });
      });
    });
    res.json({ success: true, records, history });
  } catch (error) {
    next(error);
  }
};

const saveWaste = async (req, res, next) => {
  try {
    const { date, items, notes } = req.body;
    if (!date || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'date and items[] required.' });
    }
    const record = await FoodWaste.findOneAndUpdate(
      { date },
      { date, items, notes: notes || '', recordedBy: req.user.id },
      { upsert: true, new: true }
    );
    res.json({ success: true, record });
  } catch (error) {
    next(error);
  }
};

const predictWaste = async (_req, res, next) => {
  try {
    const payload = await collectTrainingData();
    await mlClient.trainWaste(payload).catch(() => null);
    const prediction = await mlClient.predictWaste(payload);
    res.json({ success: true, prediction: stripPredictionMeta(prediction) });
  } catch (error) {
    next(error);
  }
};

module.exports = { listWaste, saveWaste, predictWaste };
