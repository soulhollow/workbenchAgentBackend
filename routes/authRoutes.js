const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Route für die Benutzerregistrierung
router.post('/register', authController.register);

// Route für die Benutzeranmeldung
router.post('/login', authController.login);

// Route zum Abrufen der aktuellen Benutzerdaten (geschützt durch authMiddleware)
router.get('/me', authMiddleware, authController.getCurrentUser);

// Route zum Aktualisieren der Benutzerdaten (geschützt durch authMiddleware)
router.put('/me', authMiddleware, authController.updateUser);

module.exports = router;