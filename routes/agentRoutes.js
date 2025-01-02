const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const authMiddleware = require('../middleware/authMiddleware');

// Route zum Erstellen eines neuen KI-Agenten (geschützt durch Authentifizierung)
router.post('/', authMiddleware, agentController.createAIAgent);

// Route zum Abrufen aller KI-Agenten eines Benutzers (geschützt durch Authentifizierung)
router.get('/', authMiddleware, agentController.getAgents);

// Route zum Abrufen eines bestimmten KI-Agenten (geschützt durch Authentifizierung)
router.get('/:id', authMiddleware, agentController.getAgentById);

// Route zum Aktualisieren eines KI-Agenten (geschützt durch Authentifizierung)
router.put('/:id', authMiddleware, agentController.updateAgent);

// Route zum Löschen eines KI-Agenten (geschützt durch Authentifizierung)
router.delete('/:id', authMiddleware, agentController.deleteAgent);

// Route zum Abrufen des Status der Agenten-Ausführung
router.get('/run/:id/status', authMiddleware, agentController.getAgentRunStatus);

// Route zum Abrufen der Ergebnisse der Agenten-Ausführung
router.get('/run/:id/results', authMiddleware, agentController.getAgentRunResults);

router.post('/run/:id', authMiddleware, agentController.runAgent);

module.exports = router;