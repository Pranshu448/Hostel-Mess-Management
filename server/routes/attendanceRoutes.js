const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  markAttendance,
  getStudentAttendance,
  getQrForToday,
  listByDate,
} = require('../controllers/attendanceController');

const router = express.Router();

router.use(protect);
router.get('/me', getStudentAttendance);
router.get('/qr', getQrForToday);
router.post('/mark', markAttendance);
router.get('/list', authorize('admin'), listByDate);

module.exports = router;
