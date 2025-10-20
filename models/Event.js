const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    eventName: { type: String, required: true },
    eventType: { type: String, enum: ['xp_multiplier', 'special_topic'], required: true },
    multiplier: { type: Number, default: 1 },
    specialTopic: String,
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);