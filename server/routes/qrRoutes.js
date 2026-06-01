const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { processGenericQr, validateOnly } = require('../controllers/qrController');

const router = express.Router();
router.use(protect);

router.post('/scan', authorize('admin'), processGenericQr);
router.post('/validate', authorize('admin'), validateOnly);

module.exports = router;
