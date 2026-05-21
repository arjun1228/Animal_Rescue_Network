const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      // e.g. ROLE_CHANGED | RESCUE_APPROVED | RESCUE_REJECTED | RESCUE_DELETED | CAMPAIGN_CREATED
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'targetModel',
      default: null,
    },
    targetModel: {
      type: String,
      enum: ['User', 'RescueRequest', 'Donation'],
      default: null,
    },
    targetLabel: { type: String, default: null }, // human-readable target (name, animalType, title…)
    oldValue: { type: String, default: null },
    newValue: { type: String, default: null },
    ip: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
