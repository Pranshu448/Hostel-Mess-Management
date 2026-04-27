const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const CrowdStatus = require('../models/CrowdStatus');

const today = () => new Date().toISOString().slice(0, 10);

const getAdminOverview = async (_req, res, next) => {
  try {
    const [totalStudents, todayAttendance, pendingPayments, crowd] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Attendance.countDocuments({ date: today(), status: 'present' }),
      Payment.countDocuments({ status: 'pending' }),
      CrowdStatus.findOne().sort({ updatedAt: -1 }),
    ]);

    res.json({
      success: true,
      overview: {
        totalStudents,
        todaysAttendance: todayAttendance,
        mealsServed: todayAttendance * 3,
        pendingPayments,
        crowdLevel: crowd?.level || 'Low',
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAdminOverview };
