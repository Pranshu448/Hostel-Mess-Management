const Dish = require('../models/Dish');
const Inventory = require('../models/Inventory');
const NutritionConfig = require('../models/NutritionConfig');
const FoodRating = require('../models/FoodRating');
const MealAttendance = require('../models/MealAttendance');
const QrScanLog = require('../models/QrScanLog');
const FoodWaste = require('../models/FoodWaste');
const IngredientUsage = require('../models/IngredientUsage');
const User = require('../models/User');

const dishes = [
  { name: 'Paneer Butter Masala', mealTypes: ['lunch', 'dinner'], nutrition: { calories: 520, protein: 22, carbohydrates: 38, fat: 28, fiber: 4 }, ingredients: [{ name: 'Paneer', quantityPerServing: 0.12, unit: 'kg' }, { name: 'Rice', quantityPerServing: 0.08, unit: 'kg' }] },
  { name: 'Rajma Rice', mealTypes: ['lunch', 'dinner'], nutrition: { calories: 480, protein: 18, carbohydrates: 72, fat: 12, fiber: 9 }, ingredients: [{ name: 'Dal', quantityPerServing: 0.15, unit: 'kg' }, { name: 'Rice', quantityPerServing: 0.18, unit: 'kg' }] },
  { name: 'Soybean Curry', mealTypes: ['lunch', 'dinner'], nutrition: { calories: 390, protein: 24, carbohydrates: 42, fat: 14, fiber: 8 }, ingredients: [{ name: 'Dal', quantityPerServing: 0.1, unit: 'kg' }] },
  { name: 'Aloo Paratha', mealTypes: ['breakfast'], nutrition: { calories: 420, protein: 10, carbohydrates: 58, fat: 16, fiber: 5 }, ingredients: [{ name: 'Wheat Flour', quantityPerServing: 0.1, unit: 'kg' }] },
  { name: 'Chole Bhature', mealTypes: ['breakfast', 'lunch'], nutrition: { calories: 610, protein: 16, carbohydrates: 78, fat: 26, fiber: 7 }, ingredients: [{ name: 'Wheat Flour', quantityPerServing: 0.12, unit: 'kg' }] },
  { name: 'Dal Makhani', mealTypes: ['dinner'], nutrition: { calories: 450, protein: 16, carbohydrates: 52, fat: 18, fiber: 6 }, ingredients: [{ name: 'Dal', quantityPerServing: 0.14, unit: 'kg' }] },
  { name: 'Idli Sambar', mealTypes: ['breakfast'], nutrition: { calories: 320, protein: 9, carbohydrates: 58, fat: 4, fiber: 4 }, ingredients: [{ name: 'Rice', quantityPerServing: 0.06, unit: 'kg' }] },
  { name: 'Veg Pulao', mealTypes: ['lunch'], nutrition: { calories: 410, protein: 8, carbohydrates: 68, fat: 10, fiber: 3 }, ingredients: [{ name: 'Rice', quantityPerServing: 0.16, unit: 'kg' }, { name: 'Vegetables', quantityPerServing: 0.08, unit: 'kg' }] },
  { name: 'Poha', mealTypes: ['breakfast'], nutrition: { calories: 280, protein: 6, carbohydrates: 48, fat: 7, fiber: 3 }, ingredients: [{ name: 'Rice', quantityPerServing: 0.05, unit: 'kg' }] },
  { name: 'Dosa', mealTypes: ['breakfast'], nutrition: { calories: 350, protein: 7, carbohydrates: 55, fat: 9, fiber: 2 }, ingredients: [{ name: 'Rice', quantityPerServing: 0.07, unit: 'kg' }] },
  { name: 'Bhelpuri', mealTypes: ['snacks'], nutrition: { calories: 220, protein: 4, carbohydrates: 38, fat: 6, fiber: 3 }, ingredients: [{ name: 'Spices', quantityPerServing: 0.01, unit: 'kg' }] },
  { name: 'Kadhi Pakoda', mealTypes: ['lunch'], nutrition: { calories: 400, protein: 12, carbohydrates: 45, fat: 18, fiber: 4 }, ingredients: [{ name: 'Dal', quantityPerServing: 0.08, unit: 'kg' }] },
];

const inventoryItems = [
  { name: 'Rice', quantity: 500, unit: 'kg', cost: 45 },
  { name: 'Wheat Flour', quantity: 200, unit: 'kg', cost: 35 },
  { name: 'Dal', quantity: 150, unit: 'kg', cost: 80 },
  { name: 'Paneer', quantity: 80, unit: 'kg', cost: 320 },
  { name: 'Vegetables', quantity: 120, unit: 'kg', cost: 40 },
  { name: 'Milk', quantity: 200, unit: 'L', cost: 55 },
  { name: 'Eggs', quantity: 1000, unit: 'units', cost: 6 },
  { name: 'Oil', quantity: 50, unit: 'L', cost: 120 },
  { name: 'Sugar', quantity: 80, unit: 'kg', cost: 42 },
  { name: 'Spices', quantity: 25, unit: 'kg', cost: 200 },
];

const seedEnhancedData = async () => {
  try {
    await NutritionConfig.findOneAndUpdate({}, {}, { upsert: true, new: true });

    for (const dish of dishes) {
      await Dish.findOneAndUpdate({ name: dish.name }, dish, { upsert: true, new: true });
    }

    const today = new Date().toISOString().slice(0, 10);
    for (const item of inventoryItems) {
      await Inventory.findOneAndUpdate(
        { name: item.name },
        { ...item, purchaseDate: today, expiryDate: '' },
        { upsert: true, new: true }
      );
    }

    const students = await User.find({ role: 'student' }).limit(20);
    const dishNames = dishes.map((d) => d.name);
    const mealScale = { breakfast: 0.55, lunch: 1, snacks: 0.35, dinner: 0.9 };

    if (students.length > 0) {
      for (const student of students) {
        for (let i = 0; i < 5; i += 1) {
          const dishName = dishNames[(student._id.toString().length + i) % dishNames.length];
          await FoodRating.findOneAndUpdate(
            { student: student._id, dishName },
            { student: student._id, dishName, rating: 2 + ((i + student.username.length) % 4) },
            { upsert: true }
          );
        }
      }
    }

    for (let dayOffset = 45; dayOffset >= 0; dayOffset -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - dayOffset);
      const date = d.toISOString().slice(0, 10);
      const dow = d.getDay();
      const baseCount = 80 + Math.floor(20 * Math.sin(dayOffset / 7));

      for (const meal of ['breakfast', 'lunch', 'snacks', 'dinner']) {
        const count = Math.floor(baseCount * (mealScale[meal] || 1));

        if (students.length > 0) {
          for (let c = 0; c < Math.min(count, students.length); c += 1) {
            const student = students[c % students.length];
            await MealAttendance.findOneAndUpdate(
              { student: student._id, date, mealType: meal },
              { student: student._id, date, mealType: meal, source: c % 2 === 0 ? 'qr' : 'manual' },
              { upsert: true }
            );
            await QrScanLog.create({
              date,
              mealType: meal,
              qrType: `mess-${meal === 'snacks' ? 'snack' : meal}`,
              student: student._id,
              isHoliday: dow === 0,
              isExamPeriod: false,
            }).catch(() => {});
          }
        }

        await IngredientUsage.findOneAndUpdate(
          { date, mealType: meal },
          {
            date,
            mealType: meal,
            attendanceCount: count,
            menuItems: [dishNames[dayOffset % dishNames.length]],
            items: [
              { ingredient: 'Rice', quantity: Math.round(count * 0.2 * 10) / 10, unit: 'kg' },
              { ingredient: 'Wheat Flour', quantity: Math.round(count * 0.08 * 10) / 10, unit: 'kg' },
              { ingredient: 'Dal', quantity: Math.round(count * 0.12 * 10) / 10, unit: 'kg' },
              { ingredient: 'Paneer', quantity: Math.round(count * 0.07 * 10) / 10, unit: 'kg' },
              { ingredient: 'Vegetables', quantity: Math.round(count * 0.1 * 10) / 10, unit: 'kg' },
              { ingredient: 'Milk', quantity: Math.round(count * 0.05 * 10) / 10, unit: 'L' },
              { ingredient: 'Oil', quantity: Math.round(count * 0.02 * 10) / 10, unit: 'L' },
            ],
          },
          { upsert: true, new: true }
        );
      }

      await FoodWaste.findOneAndUpdate(
        { date },
        {
          date,
          items: [
            { ingredient: 'Rice', quantity: 3 + (dayOffset % 6) * 0.5, unit: 'kg' },
            { ingredient: 'Paneer', quantity: 0.5 + (dayOffset % 4) * 0.3, unit: 'kg' },
            { ingredient: 'Dal', quantity: 1.5 + (dayOffset % 3) * 0.4, unit: 'kg' },
            { ingredient: 'Vegetables', quantity: 2 + (dayOffset % 5) * 0.3, unit: 'kg' },
          ],
        },
        { upsert: true, new: true }
      );
    }

    console.log('✅ Enhanced ML training data seeded.');
  } catch (err) {
    console.error('❌ Enhanced seeder failed:', err);
  }
};

module.exports = seedEnhancedData;
