const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getWeeklyMenu,
  saveWeeklyMenu,
  getActivePreferenceForm,
  createPreferenceForm,
  submitPreferenceResponse,
  getSuggestedMenu,
} = require('../controllers/menuController');

const router = express.Router();

router.use(protect);
router.get('/weekly', getWeeklyMenu);
router.post('/weekly', authorize('admin'), saveWeeklyMenu);
router.get('/preferences/form', getActivePreferenceForm);
router.post('/preferences/form', authorize('admin'), createPreferenceForm);
router.post('/preferences/submit', authorize('student'), submitPreferenceResponse);
router.get('/preferences/suggestions', authorize('admin'), getSuggestedMenu);

module.exports = router;
