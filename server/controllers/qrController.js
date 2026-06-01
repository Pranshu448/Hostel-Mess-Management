const { validateQrPayload } = require('../services/qrValidationService');
const MealAttendance = require('../models/MealAttendance');
const QrScanLog = require('../models/QrScanLog');
const { processScan } = require('./transactionController');

const processGenericQr = async (req, res, next) => {
  try {
    const { payload, raw } = req.body;
    const validation = validateQrPayload(raw || payload);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.error });
    }

    if (validation.action === 'process_billing') {
      req.body = validation.payload;
      return processScan(req, res, next);
    }

    const mealType =
      ['breakfast', 'lunch', 'snacks', 'dinner'].includes(validation.mealType)
        ? validation.mealType
        : validation.mealType === 'entrance' || validation.mealType === 'gate'
          ? 'lunch'
          : 'lunch';

    const studentId =
      req.user.role === 'admin' && req.body.studentId ? req.body.studentId : validation.studentId;

    const attendance = await MealAttendance.findOneAndUpdate(
      { student: studentId, date: validation.date, mealType },
      {
        student: studentId,
        date: validation.date,
        mealType,
        source: 'qr',
        qrType: validation.qrType,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await QrScanLog.create({
      date: validation.date,
      mealType,
      qrType: validation.qrType,
      student: studentId,
      token: validation.token,
    });

    res.json({
      success: true,
      message: `${mealType} attendance recorded`,
      attendance,
      qrType: validation.qrType,
      token: validation.token,
    });
  } catch (error) {
    next(error);
  }
};

const validateOnly = async (req, res, next) => {
  try {
    const validation = validateQrPayload(req.body.raw || req.body.payload);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.error });
    }
    res.json({ success: true, validation });
  } catch (error) {
    next(error);
  }
};

module.exports = { processGenericQr, validateOnly };
