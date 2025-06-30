const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');
const { authenticateAdmin, authenticateUser, authenticateUserOrAdmin } = require('../middlewares/auth');


router.get('/dashboard', authenticateUser, auth.userDashboard);
router.post('/register', authenticateAdmin, auth.registerUser);
router.get('/:id', authenticateUserOrAdmin, auth.getUserById);
router.put('/:id', authenticateAdmin, auth.updateUser);
router.delete('/:id', authenticateAdmin, auth.deleteUser);
router.get('/', authenticateAdmin, auth.getAllUsers);
module.exports = router;