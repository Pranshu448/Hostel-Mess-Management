const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error('Error: MONGO_URI environment variable is not defined in .env');
  process.exit(1);
}

// Define schemas inline to avoid dependency path issues in stand-alone script
const dayMenuSchema = new mongoose.Schema(
  {
    breakfast: { type: String, default: '' },
    lunch: { type: String, default: '' },
    snacks: { type: String, default: '' },
    dinner: { type: String, default: '' },
  },
  { _id: false }
);

const menuSchema = new mongoose.Schema(
  {
    weekStartDate: { type: String, required: true },
    days: {
      monday: dayMenuSchema,
      tuesday: dayMenuSchema,
      wednesday: dayMenuSchema,
      thursday: dayMenuSchema,
      friday: dayMenuSchema,
      saturday: dayMenuSchema,
      sunday: dayMenuSchema,
    },
  },
  { timestamps: true }
);

const Menu = mongoose.models.Menu || mongoose.model('Menu', menuSchema);

const menuData = {
  monday: {
    breakfast: 'Aloo Pyaz Paratha, Butter, Tea',
    lunch: 'Rajma, Jeera Rice, Masala Mix Raita, Roti',
    snacks: 'Bhelpuri',
    dinner: 'Chana Masala, Arhar Dal, Roti, Rice, Icecream',
  },
  tuesday: {
    breakfast: 'Poha, Daliya, Tea',
    lunch: 'Paneer Do Pyaza, Panchratan Dal, Rice, Roti',
    snacks: 'Banana Shake',
    dinner: 'Mix Veg., Dal Makhani, Rice, Roti, Rasmalai',
  },
  wednesday: {
    breakfast: 'Nutri Kulcha, Tea',
    lunch: 'Kadhi Pakoda, Rice, Roti',
    snacks: 'Chips/Biscuits',
    dinner: 'Kadhai Chicken/Paneer Tikka Masala, Lachha Paratha, Rice, Dal Tadka',
  },
  thursday: {
    breakfast: 'Idli Vada, Sambhar Chutney, Tea',
    lunch: 'Gobi Aloo, Boondi Raita, Veg Pulao, Arhar Dal, Roti',
    snacks: 'Patties',
    dinner: 'Lauki Chana, Panchratan Dal, Roti, Jeera Rice, Icecream',
  },
  friday: {
    breakfast: 'Mix Paratha, Butter, Tea',
    lunch: 'Aloo Matar Sabji, Rice, Roti, Cucumber Raita',
    snacks: 'Papaya Shake',
    dinner: 'Egg Curry/Matar Paneer, Roti, Rice, Masoor Dal',
  },
  saturday: {
    breakfast: 'Dosa, Uttapam, Sambhar, Chutney, Tea',
    lunch: 'Chole, Boondi Pudina Raita, Roti, Jeera Rice',
    snacks: 'Veg. Sandwich',
    dinner: 'Bhindi Pyaz, Dal Tadka, Roti, Rice, Sponge Rasgulla',
  },
  sunday: {
    breakfast: 'Amritsari Naan Chhole, Butter, Tea',
    lunch: 'Aloo Jeera, Chana Dal, Roti, Rice',
    snacks: '',
    dinner: 'Chilly Paneer, Dal Makhani, Roti, Jeera Rice',
  },
};

async function seed() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB.');

    const weekStartDate = new Date().toISOString().slice(0, 10);
    console.log(`Targeting weekStartDate: ${weekStartDate}`);

    // Update or insert the weekly menu
    const menu = await Menu.findOneAndUpdate(
      { weekStartDate },
      { weekStartDate, days: menuData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log('Weekly menu successfully seeded:');
    console.log(JSON.stringify(menu, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Error seeding menu database:', error);
    process.exit(1);
  }
}

seed();
