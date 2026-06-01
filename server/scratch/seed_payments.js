const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error('Error: MONGO_URI environment variable is not defined in .env');
  process.exit(1);
}

const paymentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    totalFees: { type: Number, default: 25000 },
    paidAmount: { type: Number, default: 25000 },
    status: { type: String, enum: ['pending', 'paid'], default: 'paid' },
    lastPaidAt: { type: Date },
  },
  { timestamps: true }
);

const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

async function seed() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB.');

    // Update all payments to have 25000 total fees, 25000 paid amount, and paid status
    const result = await Payment.updateMany(
      {},
      {
        $set: {
          totalFees: 25000,
          paidAmount: 25000,
          status: 'paid',
          lastPaidAt: new Date()
        }
      }
    );
    console.log(`Successfully updated ${result.modifiedCount} payment records!`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding payments database:', error);
    process.exit(1);
  }
}

seed();
