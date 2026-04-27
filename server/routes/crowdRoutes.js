const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { getCrowdStatus, updateCrowdStatus } = require('../controllers/crowdController');

const router = express.Router();
router.use(protect);

router.get('/', getCrowdStatus);
router.post('/', authorize('admin'), updateCrowdStatus);

module.exports = router;
