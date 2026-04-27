const Payment = require('../models/Payment');
const User = require('../models/User');

const ensurePayment = async (studentId) =>
  Payment.findOneAndUpdate(
    { student: studentId },
    { student: studentId, totalFees: 3000, paidAmount: 0, status: 'pending' },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

const getMyPayment = async (req, res, next) => {
  try {
    const payment = await ensurePayment(req.user.id);
    res.json({ success: true, payment });
  } catch (error) {
    next(error);
  }
};

const payNow = async (req, res, next) => {
  try {
    const payment = await ensurePayment(req.user.id);
    payment.paidAmount = payment.totalFees;
    payment.status = 'paid';
    payment.lastPaidAt = new Date();
    await payment.save();
    res.json({ success: true, payment, message: 'Payment simulated successfully.' });
  } catch (error) {
    next(error);
  }
};

const listPayments = async (_req, res, next) => {
  try {
    const students = await User.find({ role: 'student' }).select('_id username email');
    const payments = await Payment.find().populate('student', 'username email');
    const byStudent = new Map(payments.map((p) => [String(p.student?._id || p.student), p]));
    const result = students.map((student) => byStudent.get(String(student._id)) || {
      student,
      totalFees: 3000,
      paidAmount: 0,
      status: 'pending',
    });
    res.json({ success: true, payments: result });
  } catch (error) {
    next(error);
  }
};

const markPaidByAdmin = async (req, res, next) => {
  try {
    const { studentId } = req.body;
    const payment = await ensurePayment(studentId);
    payment.paidAmount = payment.totalFees;
    payment.status = 'paid';
    payment.lastPaidAt = new Date();
    await payment.save();
    res.json({ success: true, payment });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMyPayment, payNow, listPayments, markPaidByAdmin };
