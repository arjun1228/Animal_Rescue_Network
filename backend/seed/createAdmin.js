require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const ADMIN = {
  name: 'Admin',
  email: 'admin@animalrescue.com',
  phone: '9000000000',
  password: 'Admin@1234',
  role: 'admin',
};

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  const existing = await User.findOne({ email: ADMIN.email });
  if (existing) {
    console.log('Admin already exists:', ADMIN.email);
    process.exit(0);
  }

  await User.create(ADMIN);
  console.log('✅ Admin user created successfully!');
  console.log('----------------------------');
  console.log('Email   :', ADMIN.email);
  console.log('Password:', ADMIN.password);
  console.log('Role    :', ADMIN.role);
  console.log('----------------------------');
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
