const User = require('../models/User');
const Inventory = require('../models/Inventory');
const Dish = require('../models/Dish');
const FoodRating = require('../models/FoodRating');
const FoodWaste = require('../models/FoodWaste');
const Menu = require('../models/Menu');
const QrScanLog = require('../models/QrScanLog');
const IngredientUsage = require('../models/IngredientUsage');
const NutritionConfig = require('../models/NutritionConfig');
const MealAttendance = require('../models/MealAttendance');

const today = () => new Date().toISOString().slice(0, 10);

const collectTrainingData = async () => {
  const [studentCount, ratings, waste, menus, usage, dishes, config, scanLogs, inventory] = await Promise.all([
    User.countDocuments({ role: 'student', isActive: true }),
    FoodRating.find().lean(),
    FoodWaste.find().sort({ date: -1 }).limit(365).lean(),
    Menu.find().sort({ createdAt: -1 }).limit(20).lean(),
    IngredientUsage.find().sort({ date: -1 }).limit(500).lean(),
    Dish.find().lean(),
    NutritionConfig.findOne().sort({ updatedAt: -1 }).lean(),
    QrScanLog.find().sort({ createdAt: -1 }).limit(5000).lean(),
    Inventory.find().lean(),
  ]);

  const attendanceByDateMeal = {};
  scanLogs.forEach((log) => {
    const meal = log.mealType === 'general' ? 'lunch' : log.mealType;
    const key = `${log.date}|${meal}`;
    attendanceByDateMeal[key] = (attendanceByDateMeal[key] || 0) + 1;
  });

  const mealRecords = await MealAttendance.aggregate([
    { $group: { _id: { date: '$date', mealType: '$mealType' }, count: { $sum: 1 } } },
  ]);
  mealRecords.forEach((r) => {
    const key = `${r._id.date}|${r._id.mealType}`;
    attendanceByDateMeal[key] = Math.max(attendanceByDateMeal[key] || 0, r.count);
  });

  const attendance_logs = Object.entries(attendanceByDateMeal).map(([key, count]) => {
    const [date, mealType] = key.split('|');
    const d = new Date(date);
    return {
      date,
      mealType,
      count,
      dayOfWeek: d.getDay(),
      isHoliday: d.getDay() === 0,
      isExamPeriod: false,
    };
  });

  const waste_records = waste.map((w) => ({
    date: w.date,
    items: w.items,
    attendance: attendance_logs.find((a) => a.date === w.date && a.mealType === 'lunch')?.count || 400,
  }));

  const nutrition_targets = config
    ? {
        dailyCalories: config.dailyCalories,
        protein: config.protein,
        carbohydrates: config.carbohydrates,
        fat: config.fat,
        fiber: config.fiber,
      }
    : {};

  const formatInvName = (n) =>
    String(n || '')
      .trim()
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

  return {
    generation_nonce: Date.now(),
    student_count: studentCount || 100,
    inventory: inventory.map((i) => ({
      name: formatInvName(i.name),
      quantity: i.quantity,
      unit: i.unit || 'kg',
      cost: i.cost || 0,
    })),
    attendance_logs,
    ratings: ratings.map((r) => ({
      studentId: String(r.student),
      dishName: r.dishName,
      rating: r.rating,
    })),
    waste_records,
    menus,
    ingredient_usage: usage,
    dishes: dishes.map((d) => ({
      name: d.name,
      mealTypes: d.mealTypes,
      nutrition: d.nutrition,
      avgRating: d.avgRating,
      ingredients: d.ingredients,
    })),
    nutrition_targets,
  };
};

module.exports = { collectTrainingData, today };
