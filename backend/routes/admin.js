const express = require('express');
const router = express.Router();
const {
  getAllUsers, getAllRescues, approveRescue, rejectRescue,
  deleteRescue, getAllDonations, updateUserRole, getAuditLogs, closeCampaign,
} = require('../controllers/adminController');
const {
  getOverview, getRescuesByMonth, getDonationsByCampaign,
  exportRescuesCSV, exportDonationsCSV,
} = require('../controllers/analyticsController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

// ── Users ─────────────────────────────────────────────────────────────────────
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);

// ── Rescues ───────────────────────────────────────────────────────────────────
router.get('/rescue', getAllRescues);
router.put('/rescue/:id/approve', approveRescue);
router.patch('/rescue/:id/reject', rejectRescue);
router.delete('/rescue/:id', deleteRescue);
router.get('/rescues/export', exportRescuesCSV);       // CSV export

// ── Donations ─────────────────────────────────────────────────────────────────
router.get('/donations', getAllDonations);
router.patch('/campaigns/:id/close', closeCampaign);
router.get('/donations/export', exportDonationsCSV);   // CSV export

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get('/analytics/overview', getOverview);
router.get('/analytics/rescues-by-month', getRescuesByMonth);
router.get('/analytics/donations-by-campaign', getDonationsByCampaign);

// ── Audit log ─────────────────────────────────────────────────────────────────
router.get('/audit-logs', getAuditLogs);

module.exports = router;

