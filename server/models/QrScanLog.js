const mongoose = require('mongoose');

const qrScanLogSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    mealType: { type: String, enum: ['breakfast', 'lunch', 'snacks', 'dinner', 'entrance', 'gate', 'general'], required: true },
    qrType: { type: String, required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    token: { type: String },
    isHoliday: { type: Boolean, default: false },
    isExamPeriod: { type: Boolean, default: false },
  },
  { timestamps: true }
);

qrScanLogSchema.index({ date: 1, mealType: 1 });

module.exports = mongoose.model('QrScanLog', qrScanLogSchema);
