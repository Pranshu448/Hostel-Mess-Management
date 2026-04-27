const CrowdStatus = require('../models/CrowdStatus');

const getCrowdStatus = async (_req, res, next) => {
  try {
    let crowd = await CrowdStatus.findOne().sort({ updatedAt: -1 });
    if (!crowd) crowd = await CrowdStatus.create({ level: 'Low' });
    res.json({ success: true, crowd });
  } catch (error) {
    next(error);
  }
};

const updateCrowdStatus = async (req, res, next) => {
  try {
    const crowd = await CrowdStatus.findOneAndUpdate(
      {},
      { level: req.body.level, updatedBy: req.user.id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, crowd });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCrowdStatus, updateCrowdStatus };
