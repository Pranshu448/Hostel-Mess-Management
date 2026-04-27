const mongoose = require('mongoose');

const preferenceResponseSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    form: { type: mongoose.Schema.Types.ObjectId, ref: 'PreferenceForm', required: true },
    answers: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

preferenceResponseSchema.index({ student: 1, form: 1 }, { unique: true });

module.exports = mongoose.model('PreferenceResponse', preferenceResponseSchema);
