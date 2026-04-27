const mongoose = require('mongoose');

const dayMenuSchema = new mongoose.Schema(
  {
    breakfast: { type: String, default: '' },
    lunch: { type: String, default: '' },
    dinner: { type: String, default: '' },
  },
  { _id: false }
);

const menuSchema = new mongoose.Schema(
  {
    weekStartDate: { type: String, required: true }, // YYYY-MM-DD
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
