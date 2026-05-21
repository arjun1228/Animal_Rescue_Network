const express = require('express');
const router = express.Router();
const {
  getMyNotifications,
  markOneRead,
  markAllRead,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getMyNotifications);

// IMPORTANT: /read-all must be defined BEFORE /:id/read
// to avoid Express treating "read-all" as a notification ID
router.patch('/read-all', protect, markAllRead);
router.patch('/:id/read', protect, markOneRead);

module.exports = router;
