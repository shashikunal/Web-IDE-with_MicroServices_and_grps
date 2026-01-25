const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');

router.get('/users', usersController.getAllUsers);
router.post('/users', usersController.createUser);
router.get('/health', (req, res) => res.json({ status: 'OK' }));

module.exports = router;