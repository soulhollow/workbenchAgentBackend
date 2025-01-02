const Agent = require('../models/agent');
const axios = require('axios');
const { OpenAI } = require('openai');
const AgentRun = require('../models/agentRun');

// Konfiguriere den OpenAI-Client (nur wenn du die OpenAI API verwenden möchtest)
// const openai = new OpenAI({
//     apiKey: process.env.OPENAI_API_KEY, // API-Key aus Umgebungsvariablen
// });

const runAgent = async (req, res) => {
    try {
        const agentId = req.params.id;
        const userId = req.user.id;

        const agent = await Agent.findOne({ _id: agentId, user: userId });
        if (!agent) {
            return res.status(404).json({ message: 'KI-Agent nicht gefunden oder gehört nicht zum Benutzer.' });
        }

        const agentConfigs = agent.configuration.agents;
        const runId = Date.now().toString();

        // Erstelle einen neuen Eintrag für den Agentenlauf in der Datenbank
        const newAgentRun = new AgentRun({
            agentId: agent._id,
            runId,
            status: 'wird ausgeführt',
            results: [],
            startTime: new Date(),
            agentType: agent.type, // könnte nützlich sein für Filterung/Suche
            agentName: agent.name, // könnte nützlich sein für Filterung/Suche
            user: userId,
        });

        const runPromises = agentConfigs.map(async (agentConfig) => {
            const agentInstance = createAgent(agentConfig);
            await agentInstance.runAllTasks();

            newAgentRun.results.push({
                agentType: agentInstance.constructor.name,
                agentName: agentInstance.name,
                tasks: agentInstance.tasks,
                results: agentInstance.results,
            });
        });

        Promise.all(runPromises)
            .then(async () => {
                newAgentRun.status = 'abgeschlossen';
                newAgentRun.endTime = new Date();

                // Speichere den Agentenlauf in der Datenbank
                await newAgentRun.save();

                res.status(200).json({ message: 'KI-Agenten erfolgreich ausgeführt.', runId });
            })
            .catch(async (error) => {
                console.error(error);
                newAgentRun.status = 'Fehler';
                newAgentRun.endTime = new Date();

                // Speichere den Agentenlauf mit Fehlerstatus in der Datenbank
                await newAgentRun.save();

                res.status(500).json({ message: 'Fehler beim Ausführen der KI-Agenten.', error: error.message });
            });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Fehler beim Ausführen des KI-Agenten.' });
    }
};



// Basisklasse für einen KI-Agenten
class KIAgent {
    constructor({ name, description, model, tasks, metadata = {} }) {
        this.name = name;
        this.description = description;
        this.model = model;
        this.tasks = tasks || [];
        this.metadata = metadata;
        this.status = 'bereit'; // Füge Statusfeld für die Nachverfolgung hinzu
        this.results = null; // Hier werden die Ergebnisse gespeichert
    }

    async runAllTasks() {
        console.log(`\n== Starte Agent: ${this.name} (${this.constructor.name}) ==`);
        this.status = 'läuft'; // Status aktualisieren
        this.results = []; // Setze die Ergebnisse zurück

        for (let i = 0; i < this.tasks.length; i++) {
            const task = this.tasks[i];
            console.log(`[Task ${i + 1}] - ${task}`);
            try {
                const result = await this.runTask(task);
                this.results.push({ task, result }); // Speichere Einzelergebnisse
            } catch (error) {
                console.error(`Fehler bei Task '${task}':`, error);
                this.results.push({ task, error: error.message }); // Speichere Fehlermeldungen
                this.status = 'Fehler'; // Status aktualisieren
                return; // Stoppe die Ausführung weiterer Tasks bei Fehler
            }
        }

        this.status = 'abgeschlossen'; // Status aktualisieren
    }

    async runTask(task) {
        console.log(`   -> (Basisklasse) Task '${task}' wird nicht umgesetzt.`);
        return `(Basisklasse) Task '${task}' wird nicht umgesetzt.`; // Standard-Rückgabewert
    }
}

// Spezifischer Agent für Chat-/GPT-Interaktionen
class ChatAgent extends KIAgent {
    constructor(props) {
        super(props);
    }

    async runTask(task) {
        console.log(`   -> (ChatAgent) Erledige Chat-Aufgabe: "${task}"`);
        try {
            // DUMMY-Implementierung ohne API-Aufruf:
            const result = `(ChatAgent) Dummy-Antwort für Task: "${task}"`;
            console.log("     -> GPT-Antwort:", result);
            return result;
        } catch (error) {
            console.error('Fehler beim Aufruf der OpenAI API:', error);
            throw new Error('Fehler beim Aufrufen der OpenAI API.');
        }
    }
}

// Spezifischer Agent für Web-Scraping- und Datenextraktions-Aufgaben
class ScraperAgent extends KIAgent {
    constructor(props) {
        super(props);
    }

    async runTask(task) {
        console.log(`   -> (ScraperAgent) Führe Scraping-Aufgabe: "${task}" aus`);
        // Beispiel für Request (dummy-URL):
        try {
            const response = await axios.get('https://jsonplaceholder.typicode.com/posts/1');
            console.log(`   -> Simulierter HTTP-Request-Status: ${response.status}`);
            return `Simulierter HTTP-Request-Status: ${response.status}`;
            // ... hier könnte man den Inhalt weiterverarbeiten
        } catch (err) {
            console.error('   -> Fehler beim HTTP-Request:', err.message);
            throw new Error('Fehler beim HTTP-Request.');
        }
    }
}

// Hilfsfunktion, die basierend auf "type" das passende Agenten-Objekt
function createAgent(agentConfig) {
    switch (agentConfig.type) {
        case 'ChatAgent':
            return new ChatAgent(agentConfig);
        case 'ScraperAgent':
            return new ScraperAgent(agentConfig);
        default:
            return new KIAgent(agentConfig);
    }
}

// Neuen KI-Agenten erstellen
const createAIAgent = async (req, res) => {
    try {
        const { name, description, configuration } = req.body;
        const userId = req.user.id;

        const newAgent = new Agent({
            name,
            description,
            configuration,
            user: userId,
        });

        const savedAgent = await newAgent.save();
        res.status(201).json(savedAgent);
    } catch (error) {
        console.error(error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Fehler beim Erstellen des KI-Agenten.' });
    }
};

// Alle KI-Agenten eines Benutzers abrufen
const getAgents = async (req, res) => {
    try {
        const userId = req.user.id;
        const agents = await Agent.find({ user: userId });
        res.status(200).json(agents);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Fehler beim Abrufen der KI-Agenten.' });
    }
};

// Einen bestimmten KI-Agenten abrufen
const getAgentById = async (req, res) => {
    try {
        const agentId = req.params.id;
        const userId = req.user.id;

        const agent = await Agent.findOne({ _id: agentId, user: userId });

        if (!agent) {
            return res.status(404).json({ message: 'KI-Agent nicht gefunden oder gehört nicht zum Benutzer.' });
        }

        res.status(200).json(agent);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Fehler beim Abrufen des KI-Agenten.' });
    }
};

// Einen KI-Agenten aktualisieren
const updateAgent = async (req, res) => {
    try {
        const agentId = req.params.id;
        const userId = req.user.id;
        const { name, description, configuration } = req.body;

        const agent = await Agent.findOne({ _id: agentId, user: userId });

        if (!agent) {
            return res.status(404).json({ message: 'KI-Agent nicht gefunden oder gehört nicht zum Benutzer.' });
        }

        agent.name = name;
        agent.description = description;
        agent.configuration = configuration;

        const updatedAgent = await agent.save();
        res.status(200).json(updatedAgent);
    } catch (error) {
        console.error(error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Fehler beim Aktualisieren des KI-Agenten.' });
    }
};

// Einen KI-Agenten löschen
const deleteAgent = async (req, res) => {
    try {
        const agentId = req.params.id;
        const userId = req.user.id;

        const agent = await Agent.findOne({ _id: agentId, user: userId });

        if (!agent) {
            return res.status(404).json({ message: 'KI-Agent nicht gefunden oder gehört nicht zum Benutzer.' });
        }

        await Agent.findByIdAndDelete(agentId);
        res.status(200).json({ message: 'KI-Agent erfolgreich gelöscht.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Fehler beim Löschen des KI-Agenten.' });
    }
};



const getAgentRunStatus = async (req, res) => {
    const runId = req.params.runId;
    const userId = req.user.id;

    const agentRun = await AgentRun.findOne({ runId: runId, user: userId });

    if (!agentRun) {
        return res.status(404).json({ message: 'Keine Daten zum Lauf gefunden.' });
    }

    res.status(200).json({ status: agentRun.status });
};

// API-Endpunkt zum Abrufen der Ergebnisse der Agenten-Ausführung
const getAgentRunResults = async (req, res) => {
    const runId = req.params.runId;
    const userId = req.user.id;

    const agentRun = await AgentRun.findOne({ runId: runId, user: userId });

    if (!agentRun) {
        return res.status(404).json({ message: 'Keine Daten zum Lauf gefunden.' });
    }

    res.status(200).json({ results: agentRun.results });
};

module.exports = {
    createAIAgent,
    getAgents,
    getAgentById,
    updateAgent,
    deleteAgent,
    runAgent,
    getAgentRunStatus,
    getAgentRunResults
};