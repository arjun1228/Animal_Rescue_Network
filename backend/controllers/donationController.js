const Donation = require('../models/Donation');
const DonationEntry = require('../models/DonationEntry');
const { sendNotification, getAdminUser } = require('../services/notificationService');

// @desc    Get all active donation campaigns (or all if all=true)
// @route   GET /api/donation
const getDonations = async (req, res) => {
  const { all } = req.query;
  try {
    const filter = all === 'true' ? {} : { isActive: true };
    const campaigns = await Donation.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get donation campaign by ID (includes recent donations)
// @route   GET /api/donation/:id
const getDonationById = async (req, res) => {
  try {
    const campaign = await Donation.findById(req.params.id)
      .populate('createdBy', 'name email');
    if (!campaign) return res.status(404).json({ message: 'Donation campaign not found' });
    
    // Fetch associated donations
    const entries = await DonationEntry.find({ campaignId: campaign._id })
      .sort({ donatedAt: -1 });
      
    // Sanitize anonymous donations for public response
    const sanitizedEntries = entries.map(entry => {
      const e = entry.toObject();
      if (e.isAnonymous) {
        e.donorName = 'Anonymous';
      }
      return e;
    });

    res.json({
      ...campaign.toObject(),
      transactions: sanitizedEntries
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a donation campaign (admin only)
// @route   POST /api/donation
const createDonation = async (req, res) => {
  const { title, description, animal, targetAmount, rescueRequest, deadline } = req.body;
  try {
    if (deadline && new Date(deadline) < new Date()) {
      return res.status(400).json({ message: 'Deadline must be a future date' });
    }
    const campaign = await Donation.create({
      title, description, animal, targetAmount,
      rescueRequest: rescueRequest || null,
      deadline: deadline ? new Date(deadline) : undefined,
      createdBy: req.user._id,
    });

    // Audit log
    const { logCampaignCreated } = require('./adminController');
    logCampaignCreated(req.user._id, campaign, req.ip);

    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Make a public donation to a campaign
// @route   POST /api/donation/:id/donate
const makeDonation = async (req, res) => {
  const { donorName, email, phone, isAnonymous, amount, message } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Invalid donation amount' });
  }
  if (!donorName || !donorName.trim()) {
    return res.status(400).json({ message: 'Donor name is required' });
  }

  try {
    const campaign = await Donation.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Donation campaign not found' });
    if (!campaign.isActive) {
      return res.status(400).json({ message: 'This campaign is no longer active' });
    }

    const donationEntry = await DonationEntry.create({
      campaignId: campaign._id,
      donorName: donorName.trim(),
      email: email ? email.trim() : '',
      phone: phone ? phone.trim() : '',
      isAnonymous: Boolean(isAnonymous),
      amount: Number(amount),
      message: message ? message.trim() : '',
    });

    campaign.collectedAmount += Number(amount);

    let goalReached = false;
    if (campaign.collectedAmount >= campaign.targetAmount) {
      campaign.isActive = false;
      campaign.closedReason = 'completed';
      goalReached = true;
    }

    await campaign.save();

    // ── Notify Admin: new donation received ──────────────────────────────────
    const admin = await getAdminUser();
    if (admin) {
      sendNotification(
        admin._id,
        'DONATION_RECEIVED',
        `New donation of ₹${Number(amount).toLocaleString()} received from ${donationEntry.donorName} on campaign "${campaign.title}". Total raised: ₹${campaign.collectedAmount.toLocaleString()}.`
      );

      if (goalReached) {
        sendNotification(
          admin._id,
          'CAMPAIGN_GOAL_REACHED',
          `Campaign "${campaign.title}" has reached its goal! Raised ₹${campaign.collectedAmount.toLocaleString()} of ₹${campaign.targetAmount.toLocaleString()}.`
        );
      }
    }

    res.json({ message: 'Donation successful', collectedAmount: campaign.collectedAmount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a spam donation (Admin only)
// @route   DELETE /api/donation/entry/:id
const deleteDonationEntry = async (req, res) => {
  try {
    const entry = await DonationEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Donation entry not found' });

    const campaign = await Donation.findById(entry.campaignId);
    if (campaign) {
      campaign.collectedAmount -= entry.amount;
      // Note: we don't reopen the campaign automatically if it was closed, admin can adjust if needed
      if (campaign.collectedAmount < 0) campaign.collectedAmount = 0;
      await campaign.save();
    }

    await entry.deleteOne();
    res.json({ message: 'Donation removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDonations, getDonationById, createDonation, makeDonation, deleteDonationEntry };
