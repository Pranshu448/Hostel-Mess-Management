const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { createFeedback, myFeedback, allFeedback, resolveFeedback } = require('../controllers/feedbackController');

const router = express.Router();
router.use(protect);

router.post('/', authorize('student'), createFeedback);
router.get('/me', authorize('student'), myFeedback);
router.get('/all', authorize('admin'), allFeedback);
router.patch('/:id/resolve', authorize('admin'), resolveFeedback);

module.exports = router;
