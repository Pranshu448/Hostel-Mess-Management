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
    const { name, quantity, unit, purchaseDate, expiryDate, cost } = req.body;
    const item = await Inventory.findOneAndUpdate(
      { name: name.trim().toLowerCase() },
      {
        name: name.trim().toLowerCase(),
        quantity,
        unit: unit || 'kg',
        purchaseDate: purchaseDate || '',
        expiryDate: expiryDate || '',
        cost: cost || 0,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, item });
  } catch (error) {
    next(error);
  }
};

const deleteInventory = async (req, res, next) => {
  try {
    await Inventory.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Item removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = { listInventory, upsertInventory, deleteInventory };
