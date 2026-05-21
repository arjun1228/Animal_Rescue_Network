require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const RescueRequest = require('../models/RescueRequest');

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const all = await RescueRequest.find({});
  console.log(`📋 Found ${all.length} rescue requests to migrate`);

  let approved = 0, pendingReview = 0, skipped = 0;

  for (const rescue of all) {
    // Skip if already on the new enum values
    const newValues = ['Pending Review', 'Approved', 'Rejected', 'Claimed', 'In Progress', 'Completed'];
    if (newValues.includes(rescue.status) && rescue.isApproved === undefined) {
      skipped++;
      continue;
    }

    if (rescue.isApproved === true) {
      // Was approved → set status to 'Approved' if currently 'Pending'
      if (rescue.status === 'Pending' || rescue.status === 'Pending Review') {
        rescue.status = 'Approved';
      }
      // If already Claimed/In Progress/Completed, keep status but remove isApproved
      approved++;
    } else {
      // Was not approved → set to 'Pending Review'
      if (rescue.status === 'Pending') {
        rescue.status = 'Pending Review';
      }
      pendingReview++;
    }

    // Remove the isApproved field from the document
    rescue.set('isApproved', undefined, { strict: false });
    await rescue.save();
  }

  console.log('');
  console.log('📊 Migration Results:');
  console.log(`  ✅ Set to 'Approved':      ${approved}`);
  console.log(`  🕐 Set to 'Pending Review': ${pendingReview}`);
  console.log(`  ⏭️  Skipped (already migrated): ${skipped}`);

  // ── Step 2: Migrate lat/lng → GeoJSON geoLocation ─────────────────────────
  console.log('');
  console.log('🗺️  Step 2: Migrating lat/lng → GeoJSON geoLocation...');
  const withCoords = await RescueRequest.find({
    'location.lat': { $ne: null, $exists: true },
    'location.lng': { $ne: null, $exists: true },
    geoLocation: { $exists: false },
  });
  console.log(`   Found ${withCoords.length} docs with lat/lng to convert`);
  let geoConverted = 0;
  for (const r of withCoords) {
    if (r.location?.lat && r.location?.lng) {
      r.geoLocation = { type: 'Point', coordinates: [r.location.lng, r.location.lat] };
      await r.save();
      geoConverted++;
    }
  }
  console.log(`   ✅ Converted ${geoConverted} documents to GeoJSON`);
  console.log('');
  console.log('✅ Migration complete!');

  // Also remove isApproved field at DB level using updateMany
  await RescueRequest.updateMany({}, { $unset: { isApproved: '' } });
  console.log('🧹 Removed isApproved field from all documents');

  process.exit(0);
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
