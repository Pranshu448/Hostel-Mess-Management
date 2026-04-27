const QRCode = require('qrcode');
const Attendance = require('../models/Attendance');

const today = () => new Date().toISOString().slice(0, 10);

const markAttendance = async (req, res, next) => {
  try {
    const { studentId, date, source } = req.body;
    const targetStudent = req.user.role === 'admin' && studentId ? studentId : req.user.id;
    const targetDate = date || today();

    const attendance = await Attendance.findOneAndUpdate(
      { student: targetStudent, date: targetDate },
      { student: targetStudent, date: targetDate, status: 'present', source: source || 'qr' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, attendance });
  } catch (error) {
    next(error);
  }
};

const getStudentAttendance = async (req, res, next) => {
  try {
    const studentId = req.user.role === 'admin' && req.query.studentId ? req.query.studentId : req.user.id;
    const history = await Attendance.find({ student: studentId }).sort({ date: -1 });
    const presentDays = history.filter((item) => item.status === 'present').length;
    const monthly = history.filter((item) => item.date.startsWith(new Date().toISOString().slice(0, 7)));
    const monthlyPresent = monthly.filter((item) => item.status === 'present').length;
    const monthlyPercent = monthly.length ? Math.round((monthlyPresent / monthly.length) * 100) : 0;
    const todays = history.find((item) => item.date === today());

    res.json({
      success: true,
      statusToday: todays?.status || 'absent',
      stats: { totalPresentDays: presentDays, monthlyAttendancePercent: monthlyPercent },
      history,
    });
  } catch (error) {
    next(error);
  }
};

const getQrForToday = async (req, res, next) => {
  try {
    const payload = JSON.stringify({ studentId: req.user.id, date: today(), type: 'mess-attendance' });
    const qrCode = await QRCode.toDataURL(payload);
    res.json({ success: true, qrCode, payload: JSON.parse(payload) });
  } catch (error) {
    next(error);
  }
};

const listByDate = async (req, res, next) => {
  try {
    const date = req.query.date || today();
    const items = await Attendance.find({ date }).populate('student', 'username email');
    res.json({ success: true, date, items });
  } catch (error) {
    next(error);
  }
};

module.exports = { markAttendance, getStudentAttendance, getQrForToday, listByDate };
