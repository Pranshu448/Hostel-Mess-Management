/**
 * Run once to refresh ML training / waste history:
 * node server/scratch/reseed_ml_data.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const connectDB = require('../config/db');
const seedEnhancedData = require('../utils/enhancedSeeder');

connectDB()
  .then(() => seedEnhancedData())
  .then(() => {
    console.log('Done.');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
