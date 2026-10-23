const mongoose = require('mongoose');

async function extendSlots() {
  await mongoose.connect('mongodb://127.0.0.1:27017/medibridge');
  console.log('Connected to MongoDB');

  const extraSlots = [
    { start: '16:00', end: '17:00', mode: 'both' },
    { start: '17:00', end: '18:00', mode: 'both' },
    { start: '18:00', end: '19:00', mode: 'both' }
  ];

  const db = mongoose.connection.db;
  const doctorProfiles = await db.collection('doctorprofiles').find({}).toArray();

  console.log(`Found ${doctorProfiles.length} doctor profiles to update.`);

  for (const doc of doctorProfiles) {
    let updatedAvailability = doc.availability || [];

    // Ensure all 7 days exist
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    updatedAvailability = days.map((dayName) => {
      const existing = updatedAvailability.find((d) => d.day === dayName);
      if (dayName === 'Sunday') {
        return existing || { day: dayName, enabled: false, slots: [] };
      }

      let currentSlots = existing?.slots || [
        { start: '09:00', end: '10:00', mode: 'both' },
        { start: '10:00', end: '11:00', mode: 'both' },
        { start: '14:00', end: '15:00', mode: 'both' },
        { start: '15:00', end: '16:00', mode: 'both' }
      ];

      // Add extra slots if they don't already exist
      for (const extra of extraSlots) {
        if (!currentSlots.some((s) => s.start === extra.start)) {
          currentSlots.push({ ...extra });
        }
      }

      return {
        day: dayName,
        enabled: existing ? existing.enabled : true,
        slots: currentSlots
      };
    });

    await db.collection('doctorprofiles').updateOne(
      { _id: doc._id },
      { $set: { availability: updatedAvailability } }
    );
    console.log(`Updated doctor profile ${doc._id}`);
  }

  console.log('All doctor profiles updated with 18:00 - 19:00 slot!');
  process.exit(0);
}

extendSlots().catch((err) => {
  console.error('Failed to extend slots:', err);
  process.exit(1);
});
