const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    tasks: [{
        id: String,
        text: String,
        completed: { type: Boolean, default: false },
        priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
        reminder: { type: Date, default: null },
        reminderSent: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

todoSchema.index({ userId: 1, guildId: 1 }, { unique: true });

module.exports = mongoose.model('Todo', todoSchema);