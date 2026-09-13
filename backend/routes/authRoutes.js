const express = require('express');
const { register, login, me, listSellers } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, me);
router.get('/sellers', protect, listSellers);

module.exports = router;
