const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { getStudentAnalytics, getAdminAnalytics } = require('../controllers/analyticsController');

const router = express.Router();
router.use(protect);

router.get('/student', getStudentAnalytics);
router.get('/admin', authorize('admin'), getAdminAnalytics);

module.exports = router;
