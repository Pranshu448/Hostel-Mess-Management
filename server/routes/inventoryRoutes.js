const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { listInventory, upsertInventory } = require('../controllers/inventoryController');

const router = express.Router();
router.use(protect, authorize('admin'));

router.get('/', listInventory);
router.post('/', upsertInventory);

module.exports = router;
