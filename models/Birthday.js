const mongoose = require('mongoose');

const birthdaySchema = new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    username: String,
    month: { type: Number, required: true, min: 1, max: 12 },
    day: { type: Number, required: true, min: 1, max: 31 },
    year: { type: Number, default: null },
    notificationsSent: {
        oneDayBefore: { type: Boolean, default: false },
        oneHourBefore: { type: Boolean, default: false },
        onBirthday: { type: Boolean, default: false },
        lastNotificationYear: { type: Number, default: null }
    }
}, { timestamps: true });

birthdaySchema.index({ userId: 1, guildId: 1 }, { unique: true });

module.exports = mongoose.model('Birthday', birthdaySchema);