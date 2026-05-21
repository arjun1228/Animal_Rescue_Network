const User = require('../models/User');
const RescueRequest = require('../models/RescueRequest');
const { sendNotification } = require('../services/notificationService');

// @desc    Toggle volunteer availability
// @route   PATCH /api/volunteer/availability
const toggleAvailability = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isAvailable = !user.isAvailable;
    await user.save();
    res.json({
      message: `You are now ${user.isAvailable ? 'available' : 'unavailable'} for rescues.`,
      isAvailable: user.isAvailable,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get volunteer's active claim count (Claimed + In Progress)
// @route   GET /api/volunteer/stats
const getVolunteerStats = async (req, res) => {
  try {
    const { MAX_ACTIVE_CLAIMS } = require('../config/constants');
    const [activeClaims, volunteer] = await Promise.all([
      RescueRequest.countDocuments({
        volunteer: req.user._id,
        status: { $in: ['Claimed', 'In Progress'] },
      }),
      User.findById(req.user._id).select('isAvailable rating ratingCount'),
    ]);
    res.json({
      activeClaims,
      maxClaims: MAX_ACTIVE_CLAIMS,
      isAvailable: volunteer?.isAvailable ?? true,
      rating: volunteer?.rating ?? 0,
      ratingCount: volunteer?.ratingCount ?? 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Rate a volunteer after rescue is completed
// @route   POST /api/rescue/:id/rate
const rateVolunteer = async (req, res) => {
  const { rating } = req.body;
  if (!rating || rating < 1 || rating > 5 || !Number.isInteger(Number(rating))) {
    return res.status(400).json({ message: 'Rating must be an integer between 1 and 5.' });
  }
  try {
    const rescue = await RescueRequest.findById(req.params.id);
    if (!rescue) return res.status(404).json({ message: 'Rescue not found' });
    if (rescue.status !== 'Completed') {
      return res.status(400).json({ message: 'You can only rate a completed rescue.' });
    }
    if (rescue.reporter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the reporter can rate this rescue.' });
    }
    if (rescue.ratedByReporter) {
      return res.status(400).json({ message: 'You have already rated this rescue.' });
    }
    if (!rescue.volunteer) {
      return res.status(400).json({ message: 'No volunteer assigned to this rescue.' });
    }

    // Update running average on the volunteer
    const volunteer = await User.findById(rescue.volunteer);
    if (!volunteer) return res.status(404).json({ message: 'Volunteer not found.' });

    const newCount = volunteer.ratingCount + 1;
    const newRating = (volunteer.rating * volunteer.ratingCount + Number(rating)) / newCount;
    volunteer.rating = Math.round(newRating * 10) / 10; // round to 1 decimal
    volunteer.ratingCount = newCount;
    await volunteer.save();

    rescue.ratedByReporter = true;
    await rescue.save();

    res.json({ message: `Thank you! You rated ${volunteer.name} ${rating} ⭐`, rating: volunteer.rating });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { toggleAvailability, getVolunteerStats, rateVolunteer };
