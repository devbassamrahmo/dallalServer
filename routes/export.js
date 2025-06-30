const express = require('express');
const router = express.Router();
const { exportUsersToExcel } = require('../controllers/exportUserController');
const { protect , isAdmin } = require('../middlewares/authMiddleware');

// Endpoint to export users
router.get('/export-users' , protect , isAdmin , exportUsersToExcel);

module.exports = router;
