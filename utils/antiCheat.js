const crypto = require('crypto');
const User = require('../models/User');

const suspiciousActivity = new Map();

module.exports = {
    async checkUser(userId, ipAddress = null) {
        const user = await User.findOne({ userId });
        if (!user) return { allowed: true };

        const now = Date.now();
        const activityKey = `${userId}_${now}`;
        
        if (!suspiciousActivity.has(userId)) {
            suspiciousActivity.set(userId, []);
        }

        const userActivity = suspiciousActivity.get(userId);
        userActivity.push(now);

        const recentActivity = userActivity.filter(time => now - time < 60000);
        suspiciousActivity.set(userId, recentActivity);

        if (recentActivity.length > 10) {
            return {
                allowed: false,
                reason: 'Too many actions in a short time. Please slow down.'
            };
        }

        if (ipAddress && user.ipHash) {
            const currentHash = this.hashIP(ipAddress);
            if (user.ipHash !== currentHash) {
                const timeSinceLastActivity = now - new Date(user.lastActivity).getTime();
                if (timeSinceLastActivity < 300000) {
                    return {
                        allowed: false,
                        reason: 'Suspicious activity detected. Please try again later.'
                    };
                }
            }
        }

        return { allowed: true };
    },

    hashIP(ip) {
        return crypto.createHash('sha256').update(ip + process.env.SECRET_KEY).digest('hex');
    },

    async updateUserFingerprint(userId, ipAddress, deviceInfo = null) {
        const user = await User.findOne({ userId });
        if (!user) return;

        if (ipAddress) {
            user.ipHash = this.hashIP(ipAddress);
        }

        if (deviceInfo) {
            user.deviceFingerprint = crypto
                .createHash('sha256')
                .update(JSON.stringify(deviceInfo) + process.env.SECRET_KEY)
                .digest('hex');
        }

        user.lastActivity = new Date();
        await user.save();
    },

    async detectMultiAccounting(userId1, userId2) {
        const user1 = await User.findOne({ userId: userId1 });
        const user2 = await User.findOne({ userId: userId2 });

        if (!user1 || !user2) return { suspicious: false };

        const sameIP = user1.ipHash && user1.ipHash === user2.ipHash;
        const sameDevice = user1.deviceFingerprint && user1.deviceFingerprint === user2.deviceFingerprint;

        const timeDiff = Math.abs(
            new Date(user1.createdAt).getTime() - new Date(user2.createdAt).getTime()
        );
        const createdSameTime = timeDiff < 3600000;

        if ((sameIP && sameDevice) || (sameIP && createdSameTime)) {
            return {
                suspicious: true,
                reason: 'Potential multi-accounting detected'
            };
        }

        return { suspicious: false };
    },

    clearOldActivity() {
        const now = Date.now();
        for (const [userId, activity] of suspiciousActivity.entries()) {
            const recent = activity.filter(time => now - time < 300000);
            if (recent.length === 0) {
                suspiciousActivity.delete(userId);
            } else {
                suspiciousActivity.set(userId, recent);
            }
        }
    }
};

setInterval(() => {
    module.exports.clearOldActivity();
}, 300000);