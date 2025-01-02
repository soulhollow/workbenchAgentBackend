const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user'); // Importiere das User-Modell

// Benutzerregistrierung
const register = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Einfache Validierung
        if (!email || !password) {
            return res.status(400).json({ message: 'Bitte E-Mail und Passwort angeben.' });
        }

        // Überprüfe, ob der Benutzer bereits existiert
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Benutzer existiert bereits.' });
        }

        // Hash des Passworts erstellen
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Benutzer erstellen
        const newUser = new User({
            email,
            password: hashedPassword,
        });
        await newUser.save();

        res.status(201).json({ message: 'Benutzer erfolgreich registriert.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Serverfehler bei der Registrierung.' });
    }
};

// Benutzeranmeldung
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Einfache Validierung
        if (!email || !password) {
            return res.status(400).json({ message: 'Bitte E-Mail und Passwort angeben.' });
        }

        // Benutzer suchen
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Ungültige Anmeldedaten.' });
        }

        // Passwort überprüfen
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Ungültige Anmeldedaten.' });
        }

        // JWT erstellen
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ token });
        console.log('User logged in');
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Serverfehler bei der Anmeldung.' });
    }
};


// Aktuelle Benutzerdaten abrufen
const getCurrentUser = async (req, res) => {
    try {
        // Der Benutzer sollte bereits durch die authMiddleware zum req-Objekt hinzugefügt worden sein
        const user = req.user;

        if (!user) {
            return res.status(401).json({ message: 'Benutzer nicht authentifiziert.' });
        }

        // Entferne das Passwort aus dem Benutzerobjekt
        const userWithoutPassword = {
            id: user._id,
            email: user.email,
            // Füge hier weitere Felder hinzu, die du zurückgeben möchtest, z.B.:
            // firstName: user.firstName,
            // lastName: user.lastName,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        res.status(200).json(userWithoutPassword);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Fehler beim Abrufen des Benutzers.' });
    }
};

// Benutzerdaten aktualisieren
const updateUser = async (req, res) => {
    try {
        const userId = req.user.id; // ID des authentifizierten Benutzers
        const { email, password, ...otherUpdates } = req.body; // Destrukturiere die zu aktualisierenden Felder

        // Stelle sicher, dass der Benutzer existiert
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Benutzer nicht gefunden.' });
        }

        // Aktualisiere die E-Mail-Adresse, falls vorhanden
        if (email) {
            // Überprüfe, ob die neue E-Mail-Adresse bereits existiert
            const existingUser = await User.findOne({ email });
            if (existingUser && existingUser._id.toString() !== userId) {
                return res.status(400).json({ message: 'E-Mail-Adresse existiert bereits.' });
            }
            user.email = email;
        }

        // Aktualisiere das Passwort, falls vorhanden
        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            user.password = hashedPassword;
        }

        // Aktualisiere andere Felder (z.B. firstName, lastName)
        // Du kannst hier weitere Felder hinzufügen, die du aktualisieren möchtest
        for (const key in otherUpdates) {
            if (user.schema.path(key)) {
                user[key] = otherUpdates[key];
            }
        }

        // Speichere die aktualisierten Benutzerdaten
        const updatedUser = await user.save();

        // Entferne das Passwort aus dem zurückgegebenen Objekt
        const updatedUserWithoutPassword = {
            id: updatedUser._id,
            email: updatedUser.email,
            // Füge hier weitere Felder hinzu, die du zurückgeben möchtest
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt
        };

        res.status(200).json({ message: 'Benutzerdaten erfolgreich aktualisiert.', user: updatedUserWithoutPassword });
    } catch (error) {
        console.error(error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Fehler beim Aktualisieren des Benutzers.' });
    }
};

module.exports = { register, login, getCurrentUser, updateUser };