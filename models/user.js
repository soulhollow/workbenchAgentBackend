const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
    // Weitere Felder für Benutzerdaten können hier hinzugefügt werden, z.B.:
    // firstName: { type: String },
    // lastName: { type: String },
    // createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;