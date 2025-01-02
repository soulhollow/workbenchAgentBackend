const jwt = require('jsonwebtoken');
const User = require('../models/user');

const authMiddleware = async (req, res, next) => {
    // Hole den Token aus dem Header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

    if (!token) {
        return res.status(401).json({ message: 'Authentifizierungstoken fehlt.' });
    }

    try {
        // Verifiziere den Token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Hole den Benutzer aus der Datenbank (anhand der ID im Token)
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ message: 'Benutzer nicht gefunden.' });
        }

        // Füge den Benutzer zum Request-Objekt hinzu
        req.user = user;

        next(); // Rufe die nächste Middleware-Funktion oder den Controller auf
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: 'Ungültiges Authentifizierungstoken.' });
    }
};

module.exports = authMiddleware;