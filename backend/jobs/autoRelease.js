const cron = require('node-cron');
const RescueRequest = require('../models/RescueRequest');
const { sendNotification } = require('../services/notificationService');
const { AUTO_RELEASE_HOURS } = require('../config/constants');

/**
 * Auto-release stale "Claimed" rescues.
 * Runs every hour. If a rescue has been "Claimed" for > AUTO_RELEASE_HOURS (48h)
 * without any update, it is reset back to "Approved" and both parties are notified.
 */
const startAutoReleaseCron = () => {
  // Run every hour at :00
  cron.schedule('0 * * * *', async () => {
    try {
      const cutoff = new Date(Date.now() - AUTO_RELEASE_HOURS * 60 * 60 * 1000);
      const stale = await RescueRequest.find({
        status: 'Claimed',
        updatedAt: { $lt: cutoff },
      }).populate('volunteer', 'name');

      if (stale.length === 0) return;

      console.log(`[AutoRelease] Found ${stale.length} stale rescue(s) — releasing…`);

      for (const rescue of stale) {
        const volunteerId = rescue.volunteer?._id;
        const volunteerName = rescue.volunteer?.name || 'Volunteer';

        rescue.status = 'Approved';
        rescue.volunteer = null;
        await rescue.save();

        // Notify reporter
        sendNotification(
          rescue.reporter,
          'STATUS_UPDATE',
          `Your rescue (${rescue.animalType}) has been released back to "Approved" because ${volunteerName} did not update it within ${AUTO_RELEASE_HOURS} hours. A new volunteer can now claim it.`
        );

        // Notify volunteer
        if (volunteerId) {
          sendNotification(
            volunteerId,
            'STATUS_UPDATE',
            `Your claim on the rescue "${rescue.animalType}" was automatically released after ${AUTO_RELEASE_HOURS} hours of inactivity. It is now available for others to claim.`
          );
        }
      }

      console.log(`[AutoRelease] Released ${stale.length} rescue(s) back to Approved.`);
    } catch (err) {
      console.error('[AutoRelease] Error:', err.message);
    }
  });

  console.log(`✅ Auto-release cron started — checks every hour, releases after ${AUTO_RELEASE_HOURS}h`);
};

module.exports = { startAutoReleaseCron };
