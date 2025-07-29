const express = require('express');
const router = express.Router();
const { register, login, logout, checkPassword } = require('../controllers/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/check-password', checkPassword);

module.exports = router;