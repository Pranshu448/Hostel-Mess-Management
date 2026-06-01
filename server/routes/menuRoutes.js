const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { getWeeklyMenu, saveWeeklyMenu } = require('../controllers/menuController');
const { getNutritionConfig, saveNutritionConfig } = require('../controllers/nutritionController');
const {
  addDailyItem,
  getDailyItems,
  toggleDailyItem,
  deleteDailyItem,
} = require('../controllers/dailyItemController');

const router = express.Router();

router.use(protect);
router.get('/weekly', getWeeklyMenu);
router.post('/weekly', authorize('admin'), saveWeeklyMenu);
router.get('/nutrition', getNutritionConfig);
router.post('/nutrition', authorize('admin'), saveNutritionConfig);

// Daily items routes
router.get('/daily-items', getDailyItems);
router.post('/daily-items', authorize('admin'), addDailyItem);
router.patch('/daily-items/:id/toggle', authorize('admin'), toggleDailyItem);
router.delete('/daily-items/:id', authorize('admin'), deleteDailyItem);

module.exports = router;
