const QRCode = require('qrcode');
const Attendance = require('../models/Attendance');
const MealAttendance = require('../models/MealAttendance');
const User = require('../models/User');

const today = () => new Date().toISOString().slice(0, 10);

const inferMealFromTime = () => {
  const hour = new Date().getHours();
  if (hour < 10) return 'breakfast';
  if (hour < 15) return 'lunch';
  if (hour < 18) return 'snacks';
  return 'dinner';
};

const markAttendance = async (req, res, next) => {
  try {
    const { studentId, date, source, mealType } = req.body;
    const targetStudent = req.user.role === 'admin' && studentId ? studentId : req.user.id;
    const targetDate = date || today();
    const meal = mealType || inferMealFromTime();

    const mealRecord = await MealAttendance.findOneAndUpdate(
      { student: targetStudent, date: targetDate, mealType: meal },
      { student: targetStudent, date: targetDate, mealType: meal, status: 'present', source: source || 'manual' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const attendance = await Attendance.findOneAndUpdate(
      { student: targetStudent, date: targetDate },
      { student: targetStudent, date: targetDate, status: 'present', source: source || 'manual' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, attendance, mealAttendance: mealRecord });
  } catch (error) {
    next(error);
  }
};

const getStudentAttendance = async (req, res, next) => {
  try {
    const studentId = req.user.role === 'admin' && req.query.studentId ? req.query.studentId : req.user.id;
    const history = await Attendance.find({ student: studentId }).sort({ date: -1 });
    const mealHistory = await MealAttendance.find({ student: studentId }).sort({ date: -1 });

    const mealSummary = { breakfast: 0, lunch: 0, snacks: 0, dinner: 0 };
    mealHistory.forEach((m) => {
      if (mealSummary[m.mealType] !== undefined) mealSummary[m.mealType] += 1;
    });

    const presentDays = history.filter((item) => item.status === 'present').length;
    const monthly = history.filter((item) => item.date.startsWith(new Date().toISOString().slice(0, 7)));
    const monthlyPresent = monthly.filter((item) => item.status === 'present').length;
    const monthlyPercent = monthly.length ? Math.round((monthlyPresent / monthly.length) * 100) : 0;
    const todays = history.find((item) => item.date === today());
    const todayMeals = mealHistory.filter((m) => m.date === today());

    res.json({
      success: true,
      statusToday: todays?.status || 'absent',
      stats: {
        totalPresentDays: presentDays,
        monthlyAttendancePercent: monthlyPercent,
        mealSummary,
        totalMealsAttended: Object.values(mealSummary).reduce((a, b) => a + b, 0),
      },
      history,
      mealHistory,
      todayMeals,
    });
  } catch (error) {
    next(error);
  }
};

const getQrForToday = async (req, res, next) => {
  try {
    const mealType = req.query.mealType || inferMealFromTime();
    const qrTypeMap = {
      breakfast: 'mess-breakfast',
      lunch: 'mess-lunch',
      snacks: 'mess-snack',
      dinner: 'mess-dinner',
      entrance: 'mess-entrance',
      gate: 'mess-gate',
    };
    const type = qrTypeMap[mealType] || 'mess-attendance';
    const payload = {
      studentId: req.user.id,
      date: today(),
      type,
      mealType: ['breakfast', 'lunch', 'snacks', 'dinner'].includes(mealType) ? mealType : inferMealFromTime(),
      token: `${req.user.id}:${today()}:${type}`,
    };
    const qrCode = await QRCode.toDataURL(JSON.stringify(payload));
    res.json({ success: true, qrCode, payload });
  } catch (error) {
    next(error);
  }
};

const listByDate = async (req, res, next) => {
  try {
    const date = req.query.date || today();
    const mealType = req.query.mealType;

    const students = await User.find({ role: 'student', isActive: true }).select('username email');
    const query = { date };
    if (mealType) query.mealType = mealType;

    const existingAttendance = await MealAttendance.find(query).populate('student', 'username email');
    const existingMap = new Map(
      existingAttendance.filter((item) => item.student).map((item) => [`${item.student._id || item.student}|${item.mealType}`, item])
    );

    const mealTypes = mealType ? [mealType] : ['breakfast', 'lunch', 'snacks', 'dinner'];
    const items = [];
    students.forEach((student) => {
      mealTypes.forEach((meal) => {
        const key = `${student._id}|${meal}`;
        const existing = existingMap.get(key);
        items.push(
          existing || {
            _id: `temp-${student._id}-${meal}`,
            student,
            date,
            mealType: meal,
            status: 'absent',
            source: 'none',
          }
        );
      });
    });

    res.json({ success: true, date, items });
  } catch (error) {
    next(error);
  }
};

module.exports = { markAttendance, getStudentAttendance, getQrForToday, listByDate };
