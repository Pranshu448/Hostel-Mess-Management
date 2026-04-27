const Menu = require('../models/Menu');
const PreferenceForm = require('../models/PreferenceForm');
const PreferenceResponse = require('../models/PreferenceResponse');

const defaultDays = {
  monday: { breakfast: '', lunch: '', dinner: '' },
  tuesday: { breakfast: '', lunch: '', dinner: '' },
  wednesday: { breakfast: '', lunch: '', dinner: '' },
  thursday: { breakfast: '', lunch: '', dinner: '' },
  friday: { breakfast: '', lunch: '', dinner: '' },
  saturday: { breakfast: '', lunch: '', dinner: '' },
  sunday: { breakfast: '', lunch: '', dinner: '' },
};

const getWeeklyMenu = async (req, res, next) => {
  try {
    const weekStartDate = req.query.weekStartDate || new Date().toISOString().slice(0, 10);
    const menu = await Menu.findOne({ weekStartDate });
    res.json({ success: true, menu: menu || { weekStartDate, days: defaultDays } });
  } catch (error) {
    next(error);
  }
};

const saveWeeklyMenu = async (req, res, next) => {
  try {
    const { weekStartDate, days } = req.body;
    const menu = await Menu.findOneAndUpdate(
      { weekStartDate },
      { weekStartDate, days },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, menu });
  } catch (error) {
    next(error);
  }
};

const getActivePreferenceForm = async (_req, res, next) => {
  try {
    let form = await PreferenceForm.findOne({ active: true }).sort({ createdAt: -1 });
    if (!form) {
      form = await PreferenceForm.create({
        title: 'Weekly Food Preferences',
        active: true,
        questions: [
          { id: 'favBreakfast', label: 'Preferred breakfast item', type: 'text' },
          { id: 'favLunch', label: 'Preferred lunch style', type: 'text' },
          { id: 'favDinner', label: 'Preferred dinner item', type: 'text' },
        ],
      });
    }
    res.json({ success: true, form });
  } catch (error) {
    next(error);
  }
};

const createPreferenceForm = async (req, res, next) => {
  try {
    await PreferenceForm.updateMany({ active: true }, { $set: { active: false } });
    const form = await PreferenceForm.create({
      title: req.body.title || 'Weekly Food Preferences',
      active: true,
      questions: req.body.questions || [],
    });
    res.status(201).json({ success: true, form });
  } catch (error) {
    next(error);
  }
};

const submitPreferenceResponse = async (req, res, next) => {
  try {
    const form = await PreferenceForm.findOne({ active: true }).sort({ createdAt: -1 });
    if (!form) return res.status(404).json({ success: false, message: 'No active preference form found.' });

    const response = await PreferenceResponse.findOneAndUpdate(
      { student: req.user.id, form: form._id },
      { student: req.user.id, form: form._id, answers: req.body.answers || {} },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, response });
  } catch (error) {
    next(error);
  }
};

const getSuggestedMenu = async (_req, res, next) => {
  try {
    const form = await PreferenceForm.findOne({ active: true }).sort({ createdAt: -1 });
    if (!form) return res.json({ success: true, suggestions: [] });
    const responses = await PreferenceResponse.find({ form: form._id });
    const tally = {};

    responses.forEach((entry) => {
      Object.values(entry.answers || {}).forEach((answer) => {
        if (!answer) return;
        const key = String(answer).trim().toLowerCase();
        tally[key] = (tally[key] || 0) + 1;
      });
    });

    const suggestions = Object.entries(tally)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([item, votes]) => ({ item, votes }));

    res.json({ success: true, suggestions });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWeeklyMenu,
  saveWeeklyMenu,
  getActivePreferenceForm,
  createPreferenceForm,
  submitPreferenceResponse,
  getSuggestedMenu,
};
