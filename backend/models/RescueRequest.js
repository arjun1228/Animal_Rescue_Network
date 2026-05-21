const mongoose = require('mongoose');

const rescueRequestSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    animalType: {
      type: String,
      required: [true, 'Animal type is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    location: {
      address: { type: String },
      lat: { type: Number },
      lng: { type: Number },
    },
    photos: [{ type: String }],
    // Unified status — single source of truth
    status: {
      type: String,
      enum: ['Pending Review', 'Approved', 'Rejected', 'Claimed', 'In Progress', 'Completed'],
      default: 'Pending Review',
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    volunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    completionPhoto: {
      type: String,
      default: null,
    },
    // GeoJSON point for geospatial queries
    geoLocation: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: { type: [Number] }, // [lng, lat]
    },
    // Volunteer rating: tracks if reporter already rated this rescue
    ratedByReporter: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Sparse 2dsphere index — only indexes documents where geoLocation.coordinates is set
rescueRequestSchema.index({ geoLocation: '2dsphere' }, { sparse: true });

module.exports = mongoose.model('RescueRequest', rescueRequestSchema);
