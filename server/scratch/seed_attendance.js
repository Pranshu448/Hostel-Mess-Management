const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error('Error: MONGO_URI environment variable is not defined in .env');
  process.exit(1);
}

const attendanceSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    status: { type: String, enum: ['present', 'absent'], default: 'absent' },
    source: { type: String, enum: ['qr', 'manual', 'none'], default: 'qr' },
  },
  { timestamps: true }
);

const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);

const studentIds = [
  '6a1b1ab8b8206e127a62e68f', // Rahul
  '69edfc8fcf7cb071bb11bed6'  // Jack
];

// Past dates in May 2026 to seed (excluding today, May 30, so today is free to test manual marking)
const datesToSeed = [
  '2026-05-10', '2026-05-11', '2026-05-12', '2026-05-13', '2026-05-14',
  '2026-05-16', '2026-05-17', '2026-05-18', '2026-05-19', '2026-05-20',
  '2026-05-22', '2026-05-23', '2026-05-24', '2026-05-25', '2026-05-26',
  '2026-05-27', '2026-05-28', '2026-05-29'
];

async function seed() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB.');

    // Clear old historical records to avoid duplicates/errors
    await Attendance.deleteMany({
      student: { $in: studentIds },
      date: { $in: datesToSeed }
    });
    console.log('Cleared existing seeded records for targeting dates.');

    const attendanceRecords = [];
    for (const studentId of studentIds) {
      for (const date of datesToSeed) {
        // Randomly skip a couple of days to make it look highly authentic (e.g. ~80% attendance rate)
        if (Math.random() > 0.15) {
          attendanceRecords.push({
            student: new mongoose.Types.ObjectId(studentId),
            date,
            status: 'present',
            source: Math.random() > 0.3 ? 'qr' : 'manual'
          });
        }
      }
    }

    const inserted = await Attendance.insertMany(attendanceRecords);
    console.log(`Successfully seeded ${inserted.length} attendance records!`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding attendance database:', error);
    process.exit(1);
  }
}

seed();
