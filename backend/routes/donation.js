const express = require('express');
const { getDonations, getDonationById, createDonation, makeDonation, deleteDonationEntry } = require('../controllers/donationController');
const { protect, adminOnly } = require('../middleware/auth');

module.exports = (donationLimiter) => {
  const router = express.Router();

  // Public routes
  router.get('/', getDonations);
  router.get('/:id', getDonationById);
  
  // Public donation with rate limiting
  router.post('/:id/donate', donationLimiter, makeDonation);

  // Admin only routes
  router.post('/', protect, adminOnly, createDonation);
  router.delete('/entry/:id', protect, adminOnly, deleteDonationEntry);

  return router;
};
