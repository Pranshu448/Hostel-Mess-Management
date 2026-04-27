const mongoose = require('mongoose');

const preferenceQuestionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, enum: ['text', 'select'], default: 'text' },
    options: [{ type: String }],
  },
  { _id: false }
);

const preferenceFormSchema = new mongoose.Schema(
  {
    title: { type: String, default: 'Weekly Food Preferences' },
    active: { type: Boolean, default: true },
    questions: [preferenceQuestionSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('PreferenceForm', preferenceFormSchema);
