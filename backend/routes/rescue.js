const express = require('express');
const router = express.Router();
const {
  getRescueRequests,
  getRescueById,
  createRescueRequest,
  claimRescue,
  updateRescueStatus,
  getMyRescues,
  getClaimedRescues,
  getNearbyRescues,
  rateVolunteer,
} = require('../controllers/rescueController');
const { protect, volunteerOrAdmin } = require('../middleware/auth');
const { uploadPhotos, uploadSingle, multerError } = require('../middleware/upload');

router.get('/', protect, getRescueRequests);
router.get('/my', protect, getMyRescues);
router.get('/claimed', protect, volunteerOrAdmin, getClaimedRescues);
router.get('/nearby', protect, getNearbyRescues);
router.get('/:id', protect, getRescueById);

// Upload up to 3 photos to Cloudinary when reporting a rescue
router.post('/', protect, (req, res, next) => {
  uploadPhotos(req, res, (err) => multerError(err, req, res, next));
}, createRescueRequest);

router.put('/:id/claim', protect, volunteerOrAdmin, claimRescue);

// Optionally upload 1 proof photo when updating status to Completed
router.put('/:id/status', protect, (req, res, next) => {
  uploadSingle(req, res, (err) => multerError(err, req, res, next));
}, updateRescueStatus);

// Rate the volunteer after rescue is completed (reporter only, once)
router.post('/:id/rate', protect, rateVolunteer);

module.exports = router;
