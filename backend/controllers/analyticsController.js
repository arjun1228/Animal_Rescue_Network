const RescueRequest = require('../models/RescueRequest');
const Donation = require('../models/Donation');
const DonationEntry = require('../models/DonationEntry');
const User = require('../models/User');

// ── Helper: escape CSV field ─────────────────────────────────────────────────
const csvField = (val) => {
  if (val == null) return '';
  const s = String(val).replace(/"/g, '""');
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
};

// ── GET /api/admin/analytics/overview ───────────────────────────────────────
const getOverview = async (req, res) => {
  try {
    const [
      totalRescues,
      pendingRescues,
      completedRescues,
      totalUsers,
      activeVolunteers,
      donationAgg,
    ] = await Promise.all([
      RescueRequest.countDocuments(),
      RescueRequest.countDocuments({ status: 'Pending Review' }),
      RescueRequest.countDocuments({ status: 'Completed' }),
      User.countDocuments(),
      User.countDocuments({ role: 'volunteer' }),
      Donation.aggregate([
        { $group: { _id: null, total: { $sum: '$collectedAmount' }, campaigns: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      totalRescues,
      pendingRescues,
      completedRescues,
      totalUsers,
      activeVolunteers,
      totalDonations: donationAgg[0]?.campaigns || 0,
      totalAmountRaised: donationAgg[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/admin/analytics/rescues-by-month ────────────────────────────────
const getRescuesByMonth = async (req, res) => {
  try {
    // Go back 6 months from now
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const raw = await RescueRequest.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year:  { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    // Fill in any missing months with 0
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const y = d.getFullYear();
      const m = d.getMonth() + 1; // 1-based
      const found = raw.find((r) => r._id.year === y && r._id.month === m);
      result.push({ month: `${MONTHS[m - 1]} ${y}`, count: found?.count || 0 });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/admin/analytics/donations-by-campaign ───────────────────────────
const getDonationsByCampaign = async (req, res) => {
  try {
    const campaigns = await Donation.aggregate([
      {
        $lookup: {
          from: 'donationentries',
          localField: '_id',
          foreignField: 'campaignId',
          as: 'transactions',
        },
      },
      {
        $project: {
          title: 1,
          targetAmount: 1,
          collectedAmount: 1,
          donorCount: { $size: '$transactions' },
        },
      },
      { $sort: { collectedAmount: -1 } },
    ]);
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/admin/rescues/export ─────────────────────────────────────────────
const exportRescuesCSV = async (req, res) => {
  try {
    const rescues = await RescueRequest.find()
      .populate('reporter', 'name')
      .populate('volunteer', 'name')
      .sort({ createdAt: -1 });

    const header = ['ID', 'Animal Type', 'Status', 'Reporter', 'Volunteer', 'Address', 'Submitted Date', 'Completed Date'];
    const rows = rescues.map((r) => [
      r._id,
      r.animalType,
      r.status,
      r.reporter?.name || '',
      r.volunteer?.name || '',
      r.location?.address || '',
      r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : '',
      r.status === 'Completed' && r.updatedAt ? new Date(r.updatedAt).toLocaleDateString('en-IN') : '',
    ]);

    const csv = [header, ...rows].map((row) => row.map(csvField).join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="rescues.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/admin/donations/export ──────────────────────────────────────────
const exportDonationsCSV = async (req, res) => {
  try {
    const campaigns = await Donation.find().sort({ createdAt: -1 });
    const entries = await DonationEntry.find().sort({ donatedAt: -1 });

    // Group entries by campaignId
    const entriesByCampaign = {};
    for (const entry of entries) {
      const cid = entry.campaignId.toString();
      if (!entriesByCampaign[cid]) {
        entriesByCampaign[cid] = [];
      }
      entriesByCampaign[cid].push(entry);
    }

    const header = ['Campaign', 'Donor', 'Amount (Rs.)', 'Message', 'Date'];
    const rows = [];
    for (const c of campaigns) {
      const cEntries = entriesByCampaign[c._id.toString()] || [];
      if (cEntries.length === 0) {
        rows.push([c.title, '', '', '', '']);
      } else {
        for (const t of cEntries) {
          const donorName = t.isAnonymous ? 'Anonymous' : (t.donorName || '');
          rows.push([
            c.title,
            donorName,
            t.amount,
            t.message || '',
            t.donatedAt ? new Date(t.donatedAt).toLocaleDateString('en-IN') : '',
          ]);
        }
      }
    }

    const csv = [header, ...rows].map((row) => row.map(csvField).join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="donations.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getOverview, getRescuesByMonth, getDonationsByCampaign, exportRescuesCSV, exportDonationsCSV };
