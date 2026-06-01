const User = require('../models/User');
const Payment = require('../models/Payment');
const CrowdStatus = require('../models/CrowdStatus');
const MealAttendance = require('../models/MealAttendance');

const today = () => new Date().toISOString().slice(0, 10);

const getAdminOverview = async (_req, res, next) => {
  try {
    const dateToday = today();
    const [totalStudents, mealAgg, pendingPayments, crowd] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      MealAttendance.aggregate([
        { $match: { date: dateToday } },
        { $group: { _id: '$mealType', count: { $sum: 1 } } },
      ]),
      Payment.countDocuments({ status: 'pending' }),
      CrowdStatus.findOne().sort({ updatedAt: -1 }),
    ]);

    const mealCounts = { breakfast: 0, lunch: 0, snacks: 0, dinner: 0 };
    mealAgg.forEach((row) => {
      mealCounts[row._id] = row.count;
    });
    const mealsServed = Object.values(mealCounts).reduce((a, b) => a + b, 0);

    res.json({
      success: true,
      overview: {
        totalStudents,
        todaysAttendance: mealsServed,
        mealCounts,
        mealsServed,
        pendingPayments,
        crowdLevel: crowd?.level || 'Low',
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAdminOverview };
