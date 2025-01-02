const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const agentRoutes = require('./routes/agentRoutes'); // Importiere die agentRoutes

// Lade Umgebungsvariablen aus der .env-Datei
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB-Verbindungsstring (aus MongoDB Atlas oder lokal)
const MONGO_URI = process.env.MONGO_URI;

// Verbindung zur MongoDB-Datenbank herstellen
mongoose.connect(MONGO_URI)
    .then(() => console.log('Mit MongoDB verbunden!'))
    .catch(err => console.error('Fehler bei der Verbindung zu MongoDB:', err));

// Modelle importieren (obwohl sie hier noch nicht direkt verwendet werden)
require('./models/user');
require('./models/agent');

// Middleware, um JSON-Anfragen zu parsen
app.use(express.json());

// Routen
app.use('/api/users', authRoutes);
app.use('/api/agents', agentRoutes); // Binde die agentRoutes an den Pfad /api/agents

// Starte den Server
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));