const Inventory = require('../models/Inventory');

const listInventory = async (_req, res, next) => {
  try {
    const items = await Inventory.find().sort({ name: 1 });
    res.json({ success: true, items });
  } catch (error) {
    next(error);
  }
};

const upsertInventory = async (req, res, next) => {
  try {
    const { name, quantity, unit } = req.body;
    const item = await Inventory.findOneAndUpdate(
      { name: name.trim().toLowerCase() },
      { name: name.trim().toLowerCase(), quantity, unit: unit || 'kg' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, item });
  } catch (error) {
    next(error);
  }
};

module.exports = { listInventory, upsertInventory };
