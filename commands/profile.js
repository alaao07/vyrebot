const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../models/User');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('View your or another user\'s profile')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to view profile of')
                .setRequired(false)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        
        let user = await User.findOne({ userId: targetUser.id });
        
        if (!user) {
            if (targetUser.id === interaction.user.id) {
                user = new User({
                    userId: targetUser.id,
                    username: targetUser.username
                });
                await user.save();
            } else {
                return interaction.reply({ 
                    content: 'This user hasn\'t used the bot yet!', 
                    ephemeral: true 
                });
            }
        }

        const accuracy = user.questionsAnswered > 0 
            ? ((user.correctAnswers / user.questionsAnswered) * 100).toFixed(1) 
            : 0;

        const studyRank = await User.countDocuments({ studyXP: { $gt: user.studyXP } }) + 1;
        const petRank = await User.countDocuments({ petStreak: { $gt: user.petStreak } }) + 1;
        const learningRank = await User.countDocuments({ learningStreak: { $gt: user.learningStreak } }) + 1;

        const petXPNeeded = user.petLevel * 50 + 50;
        const petProgress = ((user.petXP / petXPNeeded) * 100).toFixed(1);

        const progressBar = (current, max, length = 10) => {
            const filled = Math.floor((current / max) * length);
            const empty = length - filled;
            return '█'.repeat(filled) + '░'.repeat(empty);
        };

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle(`${targetUser.username}'s Profile`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .addFields(
                { 
                    name: '📚 Study Statistics', 
                    value: `**XP:** ${user.studyXP}\n**Rank:** #${studyRank}\n**Questions:** ${user.questionsAnswered}\n**Accuracy:** ${accuracy}%`,
                    inline: true 
                },
                { 
                    name: '🐾 Pet Statistics', 
                    value: `**Level:** ${user.petLevel}\n**XP:** ${user.petXP}/${petXPNeeded}\n**Progress:** ${progressBar(user.petXP, petXPNeeded)}\n**Streak:** ${user.petStreak} 🔥 (Rank #${petRank})`,
                    inline: true 
                },
                { 
                    name: '📖 Learning Streak', 
                    value: `**Current:** ${user.learningStreak} days 🔥\n**Rank:** #${learningRank}`,
                    inline: true 
                },
                { 
                    name: '🏆 Achievements', 
                    value: `**Rival Wins:** ${user.rivalWins}\n**Swift Wins:** ${user.swiftWins}\n**Matchmaking:** ${user.matchmakingGames}`,
                    inline: true 
                },
                { 
                    name: '⚡ Activity', 
                    value: `**Last Quiz:** ${user.lastQuizCompleted ? `<t:${Math.floor(user.lastQuizCompleted.getTime() / 1000)}:R>` : 'Never'}\n**Last Feed:** ${user.lastPetFeed ? `<t:${Math.floor(user.lastPetFeed.getTime() / 1000)}:R>` : 'Never'}\n**Last Daily:** ${user.lastDailyClaim ? `<t:${Math.floor(user.lastDailyClaim.getTime() / 1000)}:R>` : 'Never'}`,
                    inline: true 
                }
            )
            .setTimestamp()
            .setFooter({ text: `User ID: ${targetUser.id}` });

        const badges = [];
        if (user.studyXP >= 1000) badges.push('🎓 Scholar');
        if (user.petStreak >= 30) badges.push('🔥 Dedicated');
        if (user.learningStreak >= 7) badges.push('📚 Consistent');
        if (user.rivalWins >= 10) badges.push('⚔️ Champion');
        if (accuracy >= 90 && user.questionsAnswered >= 50) badges.push('🎯 Perfectionist');
        if (user.swiftWins >= 5) badges.push('⚡ Lightning');
        if (user.petLevel >= 10) badges.push('🐾 Pet Master');

        if (badges.length > 0) {
            embed.addFields({ 
                name: '🏅 Badges', 
                value: badges.join(' '), 
                inline: false 
            });
        }

        await interaction.reply({ embeds: [embed] });
    }
};