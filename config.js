module.exports = {
    xpValues: {
        5: 15,
        7: 21,
        10: 30
    },
    
    xpPerQuestion: {
        correct: 3,
        incorrect: -3
    },
    
    petFeeding: {
        cooldown: 24 * 60 * 60 * 1000,
        streakResetTime: 48 * 60 * 60 * 1000,
        minXP: 25,
        maxXP: 50,
        baseXPCap: 100,
        xpCapIncrease: 50
    },
    
    daily: {
        cooldown: 24 * 60 * 60 * 1000,
        streakResetTime: 48 * 60 * 60 * 1000,
        baseReward: 10,
        weeklyBonusDays: 7,
        weeklyBonusXP: 10
    },
    
    rival: {
        maxPlayers: 10,
        winnerMultiplier: 1.3
    },
    
    matchmaking: {
        queueTimeout: 5 * 60 * 1000
    },
    
    leaderboard: {
        usersPerPage: 10
    },
    
    colors: {
        primary: '#0099ff',
        success: '#51cf66',
        error: '#ff6b6b',
        warning: '#ffd43b',
        gold: '#FFD700',
        gemini: '#4285f4'
    },
    
    emojis: {
        fire: '🔥',
        trophy: '🏆',
        medal1: '🥇',
        medal2: '🥈',
        medal3: '🥉',
        checkmark: '✅',
        cross: '❌',
        lightning: '⚡',
        books: '📚',
        pet: '🐾',
        rival: '⚔️',
        target: '🎯',
        party: '🎉'
    }
};
