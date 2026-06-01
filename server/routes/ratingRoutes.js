const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { listRatings, listDishesForRating, submitRating } = require('../controllers/ratingController');

const router = express.Router();
router.use(protect);

router.get('/dishes', listDishesForRating);
router.get('/', listRatings);
router.post('/', authorize('student'), submitRating);

module.exports = router;
