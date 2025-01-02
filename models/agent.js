const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const agentSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Bitte gib einen Namen für den KI-Agenten an.'], // Eigene Fehlermeldung, falls kein Name angegeben wird
    },
    description: {
        type: String,
        trim: true,
    },
    configuration: {
        type: Schema.Types.Mixed, // Erlaubt das Speichern von beliebigen JSON-Objekten
        required: [true, 'Bitte gib eine Konfiguration für den KI-Agenten an.'], // Eigene Fehlermeldung, falls keine Konfiguration angegeben wird
        default: {},
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Referenz zum User-Modell
        required: [true, 'Bitte gib einen Benutzer für den KI-Agenten an.'], // Eigene Fehlermeldung, falls kein Benutzer angegeben wird
    },
}, { timestamps: true }); // Fügt automatisch createdAt und updatedAt Felder hinzu

const Agent = mongoose.model('Agent', agentSchema);

module.exports = Agent;