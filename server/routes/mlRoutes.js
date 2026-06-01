const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  generateMlMenu,
  forecastAttendance,
  forecastIngredientDemand,
  listModelVersions,
} = require('../controllers/mlController');

const router = express.Router();
router.use(protect);

router.post('/menu/generate', authorize('admin'), generateMlMenu);
router.get('/attendance/forecast', authorize('admin'), forecastAttendance);
router.get('/inventory/demand-forecast', authorize('admin'), forecastIngredientDemand);
router.get('/models', authorize('admin'), listModelVersions);

module.exports = router;
