const mongoose = require('mongoose');

const crowdStatusSchema = new mongoose.Schema(
  {
    level: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CrowdStatus', crowdStatusSchema);
