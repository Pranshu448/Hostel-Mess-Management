const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { getAdminOverview } = require('../controllers/dashboardController');

const router = express.Router();
router.use(protect, authorize('admin'));
router.get('/overview', getAdminOverview);

module.exports = router;
