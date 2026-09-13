const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const gmailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@gmail\.com$/i;

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [gmailPattern, 'Email must be a valid Gmail address ending in @gmail.com'],
    },
    password: { type: String, required: true, minlength: 6 },
    // 'user'  -> can only browse products and chat with sellers
    // 'seller'-> can create/edit/delete their OWN products, chat with buyers
    // 'admin' -> ("author") full CRUD over everything + user management
    role: { type: String, enum: ['user', 'seller', 'admin'], default: 'user' },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
  return { id: this._id, name: this.name, email: this.email, role: this.role };
};

module.exports = mongoose.model('User', userSchema);
