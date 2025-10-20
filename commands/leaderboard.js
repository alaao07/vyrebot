const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const User = require('../models/User');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View various leaderboards')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Leaderboard type')
                .setRequired(false)
                .addChoices(
                    { name: 'Study XP', value: 'studyXP' },
                    { name: 'Pet Streak', value: 'petStreak' },
                    { name: 'Learning Streak', value: 'learningStreak' },
                    { name: 'Swift Wins', value: 'swiftWins' },
                    { name: 'Rival Wins', value: 'rivalWins' }
                )),

    async execute(interaction) {
        const leaderboardType = interaction.options.getString('type') || 'studyXP';
        const page = 0;

        await this.showLeaderboard(interaction, leaderboardType, page);
    },

    async showLeaderboard(interaction, type, page) {
        const usersPerPage = 10;
        const skip = page * usersPerPage;

        const sortField = {};
        sortField[type] = -1;

        const users = await User.find()
            .sort(sortField)
            .skip(skip)
            .limit(usersPerPage);

        const totalUsers = await User.countDocuments();
        const totalPages = Math.ceil(totalUsers / usersPerPage);

        const leaderboardNames = {
            studyXP: '📚 Study XP Leaderboard',
            petStreak: '🔥 Pet Streak Leaderboard',
            learningStreak: '📖 Learning Streak Leaderboard',
            swiftWins: '⚡ Swift Wins Leaderboard',
            rivalWins: '⚔️ Rival Wins Leaderboard'
        };

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle(leaderboardNames[type])
            .setDescription(`Page ${page + 1} of ${totalPages}`)
            .setTimestamp();

        let description = '';
        users.forEach((user, index) => {
            const rank = skip + index + 1;
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
            
            let value = user[type];
            if (type === 'petStreak' || type === 'learningStreak') {
                value = `${value} 🔥`;
            }

            description += `${medal} **${user.username}** - ${value}\n`;
        });

        embed.addFields({ name: '\u200b', value: description || 'No users found' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`lb_${type}_0`)
                    .setLabel('⏮️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === 0),
                new ButtonBuilder()
                    .setCustomId(`lb_${type}_${Math.max(0, page - 1)}`)
                    .setLabel('◀️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === 0),
                new ButtonBuilder()
                    .setCustomId(`lb_${type}_${Math.min(totalPages - 1, page + 1)}`)
                    .setLabel('▶️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page >= totalPages - 1),
                new ButtonBuilder()
                    .setCustomId(`lb_${type}_${totalPages - 1}`)
                    .setLabel('⏭️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page >= totalPages - 1)
            );

        const typeRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`lb_studyXP_0`)
                    .setLabel('📚 Study')
                    .setStyle(type === 'studyXP' ? ButtonStyle.Success : ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`lb_petStreak_0`)
                    .setLabel('🔥 Pet')
                    .setStyle(type === 'petStreak' ? ButtonStyle.Success : ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`lb_learningStreak_0`)
                    .setLabel('📖 Learning')
                    .setStyle(type === 'learningStreak' ? ButtonStyle.Success : ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`lb_swiftWins_0`)
                    .setLabel('⚡ Swift')
                    .setStyle(type === 'swiftWins' ? ButtonStyle.Success : ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`lb_rivalWins_0`)
                    .setLabel('⚔️ Rival')
                    .setStyle(type === 'rivalWins' ? ButtonStyle.Success : ButtonStyle.Secondary)
            );

        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({ embeds: [embed], components: [typeRow, row] });
        } else {
            await interaction.reply({ embeds: [embed], components: [typeRow, row] });
        }
    }
};