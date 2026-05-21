const User = require('../models/User');
const RescueRequest = require('../models/RescueRequest');
const Donation = require('../models/Donation');
const AuditLog = require('../models/AuditLog');
const { sendNotification } = require('../services/notificationService');

// ── Audit log helper ──────────────────────────────────────────────────────────
const audit = (adminId, action, { targetId, targetModel, targetLabel, oldValue, newValue, ip } = {}) => {
  AuditLog.create({ adminId, action, targetId, targetModel, targetLabel, oldValue, newValue, ip }).catch(() => {});
};

// @desc    Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all rescue requests (admin only)
const getAllRescues = async (req, res) => {
  try {
    const rescues = await RescueRequest.find()
      .populate('reporter', 'name email phone')
      .populate('volunteer', 'name email phone isAvailable')
      .sort({ createdAt: -1 });
    res.json(rescues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve a rescue (Pending Review → Approved)
const approveRescue = async (req, res) => {
  try {
    const rescue = await RescueRequest.findById(req.params.id);
    if (!rescue) return res.status(404).json({ message: 'Rescue request not found' });
    if (rescue.status !== 'Pending Review') {
      return res.status(400).json({ message: `Cannot approve a rescue with status: ${rescue.status}` });
    }
    rescue.status = 'Approved';
    rescue.rejectionReason = null;
    await rescue.save();

    sendNotification(rescue.reporter, 'RESCUE_APPROVED', `Your rescue report has been approved by the admin!`);

    audit(req.user._id, 'RESCUE_APPROVED', {
      targetId: rescue._id, targetModel: 'RescueRequest',
      targetLabel: `${rescue.animalType} @ ${rescue.location?.address}`,
      oldValue: 'Pending Review', newValue: 'Approved', ip: req.ip,
    });

    res.json({ message: 'Rescue request approved', rescue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject a rescue with reason (Pending Review → Rejected)
const rejectRescue = async (req, res) => {
  const { reason } = req.body;
  if (!reason || !reason.trim()) return res.status(400).json({ message: 'A rejection reason is required.' });
  try {
    const rescue = await RescueRequest.findById(req.params.id);
    if (!rescue) return res.status(404).json({ message: 'Rescue request not found' });
    if (rescue.status !== 'Pending Review') {
      return res.status(400).json({ message: `Cannot reject a rescue with status: ${rescue.status}` });
    }
    rescue.status = 'Rejected';
    rescue.rejectionReason = reason.trim();
    await rescue.save();

    sendNotification(rescue.reporter, 'RESCUE_REJECTED', `Your rescue report was rejected. Reason: ${reason.trim()}`);

    audit(req.user._id, 'RESCUE_REJECTED', {
      targetId: rescue._id, targetModel: 'RescueRequest',
      targetLabel: `${rescue.animalType} @ ${rescue.location?.address}`,
      newValue: reason.trim(), ip: req.ip,
    });

    res.json({ message: 'Rescue request rejected', rescue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Hard-delete a rescue (admin only)
const deleteRescue = async (req, res) => {
  try {
    const rescue = await RescueRequest.findById(req.params.id);
    if (!rescue) return res.status(404).json({ message: 'Rescue request not found' });
    const label = `${rescue.animalType} @ ${rescue.location?.address}`;
    const reporterId = rescue.reporter;
    await rescue.deleteOne();

    sendNotification(reporterId, 'RESCUE_REMOVED', `Your rescue report has been permanently removed by the admin.`);

    audit(req.user._id, 'RESCUE_DELETED', {
      targetId: req.params.id, targetModel: 'RescueRequest',
      targetLabel: label, ip: req.ip,
    });

    res.json({ message: 'Rescue request removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all donation records
const getAllDonations = async (req, res) => {
  try {
    const donations = await Donation.find().populate('createdBy', 'name email').sort({ createdAt: -1 });
    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user role with last-admin guard
const updateUserRole = async (req, res) => {
  const { role } = req.body;
  const validRoles = ['citizen', 'volunteer', 'admin'];
  if (!validRoles.includes(role)) return res.status(400).json({ message: 'Invalid role' });
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const oldRole = user.role;

    // Last-admin protection: prevent demoting the last admin
    if (oldRole === 'admin' && role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot demote the last admin. Promote another user to admin first.' });
      }
    }

    user.role = role;
    await user.save();

    audit(req.user._id, 'ROLE_CHANGED', {
      targetId: user._id, targetModel: 'User',
      targetLabel: user.name,
      oldValue: oldRole, newValue: role, ip: req.ip,
    });

    res.json({ message: 'User role updated', user: { _id: user._id, name: user.name, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get last 50 audit logs (admin only)
const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('adminId', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Called from donationController when a campaign is created
const logCampaignCreated = (adminId, campaign, ip) => {
  audit(adminId, 'CAMPAIGN_CREATED', {
    targetId: campaign._id, targetModel: 'Donation',
    targetLabel: campaign.title, newValue: `₹${campaign.targetAmount}`, ip,
  });
};

// @desc    Manually close a donation campaign (admin only)
const closeCampaign = async (req, res) => {
  try {
    const campaign = await Donation.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    if (!campaign.isActive) return res.status(400).json({ message: 'Campaign is already closed' });

    campaign.isActive = false;
    campaign.closedReason = 'admin_closed';
    await campaign.save();

    audit(req.user._id, 'CAMPAIGN_CLOSED', {
      targetId: campaign._id, targetModel: 'Donation',
      targetLabel: campaign.title,
      oldValue: 'Active', newValue: 'Closed', ip: req.ip,
    });

    res.json({ message: 'Campaign closed successfully', campaign });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllUsers, getAllRescues, approveRescue, rejectRescue,
  deleteRescue, getAllDonations, updateUserRole, getAuditLogs, logCampaignCreated,
  closeCampaign,
};
