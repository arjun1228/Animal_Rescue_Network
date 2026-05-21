const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/animal_rescue')
  .then(async () => {
    const users = await User.find({}, 'email name');
    console.log('--- Registered Users ---');
    users.forEach(u => console.log(u.email));
    console.log('------------------------');
    mongoose.disconnect();
  })
  .catch(err => console.log(err));
