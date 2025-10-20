const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../models/User');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Claim your daily learning streak'),

    async execute(interaction) {
        let user = await User.findOne({ userId: interaction.user.id });

        if (!user) {
            return interaction.reply({ 
                content: 'You need to complete at least one quiz before claiming your daily streak! Use `/study` to get started.', 
                ephemeral: true 
            });
        }

        if (!user.lastQuizCompleted) {
            return interaction.reply({ 
                content: 'You need to complete at least one quiz today before claiming your daily streak!', 
                ephemeral: true 
            });
        }

        const now = new Date();
        const lastClaim = user.lastDailyClaim;
        const lastQuiz = user.lastQuizCompleted;

        if (lastClaim) {
            const hoursSinceClaim = (now - lastClaim) / (1000 * 60 * 60);
            if (hoursSinceClaim < 24) {
                const hoursRemaining = 24 - hoursSinceClaim;
                return interaction.reply({ 
                    content: `You've already claimed your daily reward! Come back in **${hoursRemaining.toFixed(1)} hours**.`, 
                    ephemeral: true 
                });
            }
        }

        const hoursSinceQuiz = (now - lastQuiz) / (1000 * 60 * 60);
        if (hoursSinceQuiz > 24) {
            return interaction.reply({ 
                content: 'You need to complete a quiz within the last 24 hours to claim your daily streak!', 
                ephemeral: true 
            });
        }

        const streakBroken = lastClaim && (now - lastClaim) / (1000 * 60 * 60) > 48;
        
        if (streakBroken) {
            user.learningStreak = 1;
        } else {
            user.learningStreak += 1;
        }

        user.lastDailyClaim = now;
        await user.save();

        const streakBonus = Math.floor(user.learningStreak / 7) * 10;
        const totalBonus = 10 + streakBonus;

        user.studyXP += totalBonus;
        await user.save();

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🎉 Daily Streak Claimed!')
            .setDescription(`Keep up the great work, ${interaction.user.username}!`)
            .addFields(
                { name: 'Learning Streak', value: `${user.learningStreak} days 🔥`, inline: true },
                { name: 'Base Bonus', value: `+10 XP`, inline: true },
                { name: 'Streak Bonus', value: `+${streakBonus} XP`, inline: true },
                { name: 'Total Earned', value: `+${totalBonus} XP`, inline: true },
                { name: 'Total Study XP', value: `${user.studyXP} XP`, inline: true }
            );

        if (streakBroken) {
            embed.addFields({ 
                name: '⚠️ Streak Reset', 
                value: 'Your streak was reset because you missed a day!', 
                inline: false 
            });
        }

        if (user.learningStreak % 7 === 0) {
            embed.addFields({ 
                name: '🎊 Weekly Milestone!', 
                value: `You've maintained a ${user.learningStreak}-day streak!`, 
                inline: false 
            });
        }

        embed.setFooter({ text: 'Complete a quiz every day to maintain your streak!' });

        await interaction.reply({ embeds: [embed] });
    }
};