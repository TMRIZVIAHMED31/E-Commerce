const User = require('../models/User');

// @route GET /api/admin/users  (admin only)
const getUsers = async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json(users);
};

// @route DELETE /api/admin/users/:id  (admin only)
const deleteUser = async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({ message: "You can't delete your own admin account" });
  }
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  await user.deleteOne();
  res.json({ message: 'User deleted' });
};

// @route PUT /api/admin/users/:id/role  (admin only) - promote/demote user <-> seller
const updateUserRole = async (req, res) => {
  const { role } = req.body;
  if (!['user', 'seller'].includes(role)) {
    return res.status(400).json({ message: "Role must be 'user' or 'seller'" });
  }
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.role === 'admin') return res.status(400).json({ message: "Can't change another admin's role" });
  user.role = role;
  await user.save();
  res.json(user.toSafeObject());
};

module.exports = { getUsers, deleteUser, updateUserRole };
