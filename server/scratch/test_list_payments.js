const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error('Error: MONGO_URI environment variable is not defined in .env');
  process.exit(1);
}

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  role: String,
  isActive: Boolean
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

const transactionSchema = new mongoose.Schema({
  student: mongoose.Schema.Types.ObjectId,
  totalAmount: Number
});
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);

async function main() {
  try {
    await mongoose.connect(uri);
    
    const students = await User.find({ role: 'student' }).select('_id username email');
    const transactions = await Transaction.find({});
    
    console.log('Total Transactions Found:', transactions.length);
    console.log('First Transaction Student ID:', transactions[0]?.student);

    const transactionTally = {};
    transactions.forEach(t => {
      const sId = String(t.student);
      transactionTally[sId] = (transactionTally[sId] || 0) + t.totalAmount;
    });
    
    console.log('Transaction Tally Map:', transactionTally);

    const result = students.map((student) => {
      const usedFoodBudget = transactionTally[String(student._id)] || 0;
      const leftFoodBudget = Math.max(0, 15000 - usedFoodBudget);
      
      return {
        username: student.username,
        id: String(student._id),
        usedFoodBudget,
        leftFoodBudget,
      };
    });

    console.log('Computed Payments List:', result);
    process.exit(0);
  } catch (error) {
    console.error('Error running test:', error);
    process.exit(1);
  }
}

main();
