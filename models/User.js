const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    username: String,
    studyXP: { type: Number, default: 0 },
    petXP: { type: Number, default: 0 },
    petLevel: { type: Number, default: 1 },
    petStreak: { type: Number, default: 0 },
    lastPetFeed: { type: Date, default: null },
    learningStreak: { type: Number, default: 0 },
    lastQuizCompleted: { type: Date, default: null },
    lastDailyClaim: { type: Date, default: null },
    questionsAnswered: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    swiftWins: { type: Number, default: 0 },
    rivalWins: { type: Number, default: 0 },
    matchmakingGames: { type: Number, default: 0 },
    lastActivity: { type: Date, default: Date.now },
    ipHash: String,
    deviceFingerprint: String
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);