const cron = require('node-cron');
const Donation = require('../models/Donation');

/**
 * Auto-close expired donation campaigns.
 * Runs daily at midnight. Finds active campaigns where deadline < now,
 * sets isActive to false and closedReason to 'deadline_reached'.
 */
const startCampaignExpiryCron = () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      const now = new Date();
      const expiredCampaigns = await Donation.find({
        isActive: true,
        deadline: { $lt: now },
      });

      if (expiredCampaigns.length === 0) return;

      console.log(`[CampaignExpiry] Found ${expiredCampaigns.length} expired campaign(s). Closing...`);

      for (const campaign of expiredCampaigns) {
        campaign.isActive = false;
        campaign.closedReason = 'deadline_reached';
        await campaign.save();
      }

      console.log(`[CampaignExpiry] Closed ${expiredCampaigns.length} campaign(s).`);
    } catch (error) {
      console.error('[CampaignExpiry] Error:', error.message);
    }
  });

  console.log('✅ Campaign expiry cron started — checks daily at midnight');
};

module.exports = { startCampaignExpiryCron };
