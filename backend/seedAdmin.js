// Run with: npm run seed:admin
// Creates (or resets) a single admin/"author" account. Admin cannot be created
// via the public register endpoint on purpose.
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');

const run = async () => {
  await connectDB();

  const email = process.env.ADMIN_EMAIL || 'adminecommerce@gmail.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin@12345';

  let admin = await User.findOne({ email });
  if (admin) {
    admin.password = password;
    admin.role = 'admin';
    await admin.save();
    console.log(`Existing admin updated: ${email}`);
  } else {
    admin = await User.create({ name: 'Site Admin', email, password, role: 'admin' });
    console.log(`Admin created: ${email} / ${password}`);
  }

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
