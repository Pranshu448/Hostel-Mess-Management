const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { listWaste, saveWaste, predictWaste } = require('../controllers/wasteController');

const router = express.Router();
router.use(protect);

router.get('/', authorize('admin'), listWaste);
router.post('/', authorize('admin'), saveWaste);
router.get('/predict', authorize('admin'), predictWaste);

module.exports = router;
