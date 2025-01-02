const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const agentRunSchema = new Schema({
    agentId: {
        type: Schema.Types.ObjectId,
        ref: 'Agent',
        required: true,
    },
    runId: { // Zeitstempel als String ist in Ordnung
        type: String,
        required: true,
        unique: true,
    },
    status: {
        type: String,
        enum: ['wird ausgeführt', 'abgeschlossen', 'Fehler'],
        default: 'wird ausgeführt',
    },
    results: {
        type: Schema.Types.Mixed, // Hier kannst du die Ergebnisse speichern
        default: [],
    },
    startTime: {
        type: Date,
        default: Date.now,
    },
    endTime: {
        type: Date,
        default: null,
    },
    agentType: { // Eventuell überflüssig, wenn du den Agenten referenzierst
        type: String,
    },
    agentName: { // Eventuell überflüssig, wenn du den Agenten referenzierst
        type: String,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
}, { timestamps: true });

const AgentRun = mongoose.model('AgentRun', agentRunSchema);

module.exports = AgentRun;