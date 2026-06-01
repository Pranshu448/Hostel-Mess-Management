const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error('Error: MONGO_URI environment variable is not defined in .env');
  process.exit(1);
}

async function main() {
  try {
    await mongoose.connect(uri);
    const transactions = await mongoose.connection.db.collection('transactions').find({}).toArray();
    console.log('--- ALL TRANSACTIONS ---');
    console.log(JSON.stringify(transactions, null, 2));
    console.log('------------------------');
    process.exit(0);
  } catch (error) {
    console.error('Error connecting or querying:', error);
    process.exit(1);
  }
}

main();
