const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    status: { type: String, enum: ['present', 'absent'], default: 'present' },
    source: { type: String, enum: ['qr', 'manual'], default: 'qr' },
  },
  { timestamps: true }
);

attendanceSchema.index({ student: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
