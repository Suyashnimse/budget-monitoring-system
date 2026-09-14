const express = require('express');
const { getUsers, createUser, updateProfile } = require('../controllers/userController');

const router = express.Router();

router.get('/', getUsers);
router.post('/', createUser);
router.put('/profile', updateProfile);

module.exports = router;
