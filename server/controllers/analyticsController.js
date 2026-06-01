const MealAttendance = require('../models/MealAttendance');
const QrScanLog = require('../models/QrScanLog');
const User = require('../models/User');

const today = () => new Date().toISOString().slice(0, 10);
const monthPrefix = () => new Date().toISOString().slice(0, 7);

const mealTypes = ['breakfast', 'lunch', 'snacks', 'dinner'];

const buildStudentAnalytics = async (studentId) => {
  const records = await MealAttendance.find({ student: studentId });
  const summary = { breakfast: 0, lunch: 0, snacks: 0, dinner: 0 };
  records.forEach((r) => {
    if (summary[r.mealType] !== undefined) summary[r.mealType] += 1;
  });

  const monthlyTrend = {};
  const weeklyTrend = {};
  records.forEach((r) => {
    const month = r.date.slice(0, 7);
    monthlyTrend[month] = (monthlyTrend[month] || 0) + 1;
    const d = new Date(r.date);
    const weekKey = `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}`;
    weeklyTrend[weekKey] = (weeklyTrend[weekKey] || 0) + 1;
  });

  const mealWise = mealTypes.map((meal) => ({
    meal,
    count: summary[meal],
  }));

  const totalMeals = Object.values(summary).reduce((a, b) => a + b, 0);
  const daysInMonth = new Date().getDate();
  const expected = daysInMonth * 4;
  const attendancePercent = expected ? Math.round((totalMeals / expected) * 100) : 0;

  return {
    summary,
    mealWise,
    monthlyTrend: Object.entries(monthlyTrend).map(([period, count]) => ({ period, count })),
    weeklyTrend: Object.entries(weeklyTrend).map(([period, count]) => ({ period, count })),
    attendancePercent,
    totalMeals,
  };
};

const getStudentAnalytics = async (req, res, next) => {
  try {
    const studentId = req.user.role === 'admin' && req.query.studentId ? req.query.studentId : req.user.id;
    const analytics = await buildStudentAnalytics(studentId);
    res.json({ success: true, analytics });
  } catch (error) {
    next(error);
  }
};

const aggregateDailyCounts = async (date) => {
  const agg = await MealAttendance.aggregate([
    { $match: { date } },
    { $group: { _id: '$mealType', count: { $sum: 1 } } },
  ]);
  const counts = { breakfast: 0, lunch: 0, snacks: 0, dinner: 0, total: 0 };
  agg.forEach((row) => {
    counts[row._id] = row.count;
    counts.total += row.count;
  });
  return counts;
};

const buildAdminAnalytics = async () => {
  const dateToday = today();
  const todayStats = await aggregateDailyCounts(dateToday);

  const last30 = [];
  for (let i = 29; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    const counts = await aggregateDailyCounts(date);
    last30.push({ date, ...counts });
  }

  const weekly = {};
  const monthly = {};
  last30.forEach((row) => {
    const wk = row.date.slice(0, 7);
    monthly[wk] = (monthly[wk] || 0) + row.total;
    const weekNum = Math.ceil(Number(row.date.slice(8, 10)) / 7);
    const wKey = `${row.date.slice(0, 7)}-W${weekNum}`;
    weekly[wKey] = (weekly[wKey] || 0) + row.total;
  });

  const heatmap = await MealAttendance.aggregate([
    {
      $group: {
        _id: { date: '$date', mealType: '$mealType' },
        count: { $sum: 1 },
      },
    },
  ]);

  return {
    today: todayStats,
    dailyTrend: last30,
    weeklyTrend: Object.entries(weekly).map(([period, total]) => ({ period, total })),
    monthlyTrend: Object.entries(monthly).map(([period, total]) => ({ period, total })),
    heatmap: heatmap.map((h) => ({ date: h._id.date, meal: h._id.mealType, count: h.count })),
  };
};

const getAdminAnalytics = async (_req, res, next) => {
  try {
    const analytics = await buildAdminAnalytics();
    const totalStudents = await User.countDocuments({ role: 'student', isActive: true });
    res.json({
      success: true,
      analytics: {
        ...analytics,
        totalStudentsServedToday: analytics.today.total,
        totalStudents,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getStudentAnalytics, getAdminAnalytics };
