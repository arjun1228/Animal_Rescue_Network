const RescueRequest = require('../models/RescueRequest');
const { sendNotification, getAdminUser } = require('../services/notificationService');

// @desc    Get rescue requests (role-filtered)
// @route   GET /api/rescue
const getRescueRequests = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'citizen') {
      // Citizens see only their own reports (all statuses, so they can track Rejected)
      query = { reporter: req.user._id };
    } else if (req.user.role === 'volunteer') {
      // Volunteers see Approved rescues + any they have already claimed
      query = {
        $or: [
          { status: 'Approved' },
          { volunteer: req.user._id },
        ],
      };
    } else {
      // Donor / admin: all publicly visible statuses
      query = { status: { $in: ['Approved', 'Claimed', 'In Progress', 'Completed'] } };
    }

    const requests = await RescueRequest.find(query)
      .populate('reporter', 'name email phone')
      .populate('volunteer', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get rescue request by ID
// @route   GET /api/rescue/:id
const getRescueById = async (req, res) => {
  try {
    const request = await RescueRequest.findById(req.params.id)
      .populate('reporter', 'name email phone')
      .populate('volunteer', 'name email phone');
    if (!request) return res.status(404).json({ message: 'Rescue request not found' });
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a rescue request
// @route   POST /api/rescue
const createRescueRequest = async (req, res) => {
  const { animalType, description, address, lat, lng } = req.body;
  try {
    // f.path is the Cloudinary secure_url provided by multer-storage-cloudinary
    const photos = req.files ? req.files.map((f) => f.path) : [];
    const rescueData = {
      reporter: req.user._id,
      animalType,
      description,
      location: { address, lat: lat || null, lng: lng || null },
      photos,
    };
    // Store GeoJSON only when coordinates are provided
    if (lat && lng) {
      rescueData.geoLocation = {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)], // GeoJSON: [lng, lat]
      };
    }
    const rescue = await RescueRequest.create(rescueData);

    // ── Notify Admin: new rescue submitted ───────────────────────────────────
    const admin = await getAdminUser();
    if (admin) {
      sendNotification(
        admin._id,
        'NEW_RESCUE',
        `New rescue report submitted by ${req.user.name}: ${animalType} at ${address}.`
      );
    }

    res.status(201).json(rescue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Volunteer claims a rescue request
// @route   PUT /api/rescue/:id/claim
const claimRescue = async (req, res) => {
  try {
    const { MAX_ACTIVE_CLAIMS } = require('../config/constants');
    const rescue = await RescueRequest.findById(req.params.id);
    if (!rescue) return res.status(404).json({ message: 'Rescue request not found' });
    if (rescue.status !== 'Approved') {
      return res.status(400).json({ message: 'Only Approved rescues can be claimed' });
    }

    // ── Availability check ────────────────────────────────────────────────────
    const User = require('../models/User');
    const volunteerDoc = await User.findById(req.user._id);
    if (volunteerDoc && !volunteerDoc.isAvailable) {
      return res.status(400).json({ message: 'You are currently marked as unavailable. Toggle your availability first.' });
    }

    // ── Claim limit check ────────────────────────────────────────────────────
    const activeClaims = await RescueRequest.countDocuments({
      volunteer: req.user._id,
      status: { $in: ['Claimed', 'In Progress'] },
    });
    if (activeClaims >= MAX_ACTIVE_CLAIMS) {
      return res.status(400).json({
        message: `You already have ${MAX_ACTIVE_CLAIMS} active rescues. Complete one before claiming another.`,
      });
    }

    rescue.volunteer = req.user._id;
    rescue.status = 'Claimed';
    await rescue.save();

    // ── Notify Reporter ───────────────────────────────────────────────────────
    sendNotification(
      rescue.reporter,
      'RESCUE_CLAIMED',
      `A volunteer (${req.user.name}) has claimed your rescue request and is on the way!`
    );

    const updated = await RescueRequest.findById(req.params.id)
      .populate('reporter', 'name email phone')
      .populate('volunteer', 'name email phone');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update rescue status (volunteer/admin transitions only: Claimed → In Progress → Completed)
// @route   PUT /api/rescue/:id/status
const updateRescueStatus = async (req, res) => {
  const { status } = req.body;
  // Approved/Rejected/Pending Review are admin-only transitions — not allowed here
  const validStatuses = ['Claimed', 'In Progress', 'Completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Allowed: Claimed, In Progress, Completed' });
  }
  try {
    const rescue = await RescueRequest.findById(req.params.id);
    if (!rescue) return res.status(404).json({ message: 'Rescue request not found' });
    // Only assigned volunteer or admin can update status
    const isVolunteer = rescue.volunteer && rescue.volunteer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isVolunteer && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this rescue' });
    }
    if (status === 'Completed' && !req.file && !rescue.completionPhoto) {
      return res.status(400).json({ message: 'A completion proof photo is required to mark the rescue as Completed.' });
    }
    rescue.status = status;
    // Save completion proof photo URL if provided
    if (req.file) {
      rescue.completionPhoto = req.file.path;
    }
    await rescue.save();

    // ── Notify Reporter: status changed ──────────────────────────────────────
    const message = status === 'Completed'
      ? `Great news! Your animal has been rescued successfully. Status: Completed. 🎉`
      : `Your rescue request status has been updated to: ${status}.`;
    sendNotification(rescue.reporter, 'STATUS_UPDATE', message);

    const updated = await RescueRequest.findById(req.params.id)
      .populate('reporter', 'name email phone')
      .populate('volunteer', 'name email phone');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my rescue requests (as reporter) — all statuses
// @route   GET /api/rescue/my
const getMyRescues = async (req, res) => {
  try {
    const requests = await RescueRequest.find({ reporter: req.user._id })
      .populate('volunteer', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get claimed rescues (as volunteer)
// @route   GET /api/rescue/claimed
const getClaimedRescues = async (req, res) => {
  try {
    const requests = await RescueRequest.find({ volunteer: req.user._id })
      .populate('reporter', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Find nearby approved rescues
// @route   GET /api/rescue/nearby?lat=&lng=&radius=
const getNearbyRescues = async (req, res) => {
  const { lat, lng, radius = 5000 } = req.query;
  if (!lat || !lng) return res.status(400).json({ message: 'lat and lng query params are required' });
  try {
    const rescues = await RescueRequest.find({
      status: { $in: ['Approved', 'Claimed', 'In Progress'] },
      geoLocation: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius), // metres
        },
      },
    })
      .populate('reporter', 'name')
      .limit(50);
    res.json(rescues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const { rateVolunteer } = require('./volunteerController');

module.exports = {
  getRescueRequests,
  getRescueById,
  createRescueRequest,
  claimRescue,
  updateRescueStatus,
  getMyRescues,
  getClaimedRescues,
  getNearbyRescues,
  rateVolunteer,
};
