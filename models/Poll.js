const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema({
    messageId: { type: String, required: true, unique: true },
    channelId: { type: String, required: true },
    guildId: { type: String, required: true },
    creatorId: { type: String, required: true },
    question: { type: String, required: true },
    options: [{
        text: String,
        votes: [String]
    }],
    allowMultipleVotes: { type: Boolean, default: false },
    endTime: { type: Date, default: null },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Poll', pollSchema);