const mongoose = require('mongoose');

const modelVersionSchema = new mongoose.Schema(
  {
    modelName: { type: String, required: true },
    version: { type: Number, required: true },
    metrics: { type: mongoose.Schema.Types.Mixed, default: {} },
    trainedAt: { type: Date, default: Date.now },
    artifactPath: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

modelVersionSchema.index({ modelName: 1, version: -1 });

module.exports = mongoose.model('ModelVersion', modelVersionSchema);
