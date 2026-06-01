const mongoose = require('mongoose');

const mealAttendanceSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    mealType: { type: String, enum: ['breakfast', 'lunch', 'snacks', 'dinner'], required: true },
    source: { type: String, enum: ['qr', 'manual'], default: 'qr' },
    qrType: { type: String, default: 'mess-attendance' },
  },
  { timestamps: true }
);

mealAttendanceSchema.index({ student: 1, date: 1, mealType: 1 }, { unique: true });

module.exports = mongoose.model('MealAttendance', mealAttendanceSchema);
