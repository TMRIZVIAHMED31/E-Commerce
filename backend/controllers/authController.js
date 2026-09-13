const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

// @route POST /api/auth/register
// Public users can register as 'user' or 'seller'. Admin accounts are seeded separately
// (see seedAdmin.js) so nobody can self-register as admin/author.
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@gmail\.com$/i.test(email.trim())) {
      return res.status(400).json({ message: 'Please use a valid Gmail address ending in @gmail.com' });
    }

    const allowedRoles = ['user', 'seller'];
    const finalRole = allowedRoles.includes(role) ? role : 'user';

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password, role: finalRole });
    const token = signToken(user);

    res.status(201).json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

// @route POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken(user);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

// @route GET /api/auth/me
const me = async (req, res) => {
  res.json({ user: req.user.toSafeObject ? req.user.toSafeObject() : req.user });
};

// @route GET /api/auth/sellers  (used by users to start a chat / browse sellers)
const listSellers = async (req, res) => {
  const sellers = await User.find({ role: 'seller' }).select('name email _id');
  res.json(sellers);
};

module.exports = { register, login, me, listSellers };
