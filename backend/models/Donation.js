const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Campaign title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Campaign description is required'],
    },
    animal: {
      type: String,
      required: [true, 'Animal name/type is required'],
    },
    rescueRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RescueRequest',
      default: null,
    },
    targetAmount: {
      type: Number,
      required: [true, 'Target amount is required'],
      min: 1,
    },
    collectedAmount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    deadline: {
      type: Date,
      required: [true, 'Campaign deadline is required'],
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days for legacy
    },
    closedReason: {
      type: String,
      enum: ['completed', 'deadline_reached', 'admin_closed', null],
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Donation', donationSchema);
