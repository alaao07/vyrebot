const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../models/User');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('petfeed')
        .setDescription('Feed your virtual pet to maintain your streak'),

    async execute(interaction) {
        let user = await User.findOne({ userId: interaction.user.id });
        
        if (!user) {
            user = new User({
                userId: interaction.user.id,
                username: interaction.user.username
            });
        }

        const now = new Date();
        const lastFeed = user.lastPetFeed;
        const hoursSinceLastFeed = lastFeed ? (now - lastFeed) / (1000 * 60 * 60) : 25;

        if (hoursSinceLastFeed < 24) {
            const hoursRemaining = 24 - hoursSinceLastFeed;
            const embed = new EmbedBuilder()
                .setColor('#ff6b6b')
                .setTitle('🐾 Pet Already Fed!')
                .setDescription(`Your pet is still full! Come back in **${hoursRemaining.toFixed(1)} hours**.`)
                .addFields(
                    { name: 'Current Streak', value: `${user.petStreak} 🔥`, inline: true },
                    { name: 'Pet Level', value: `${user.petLevel}`, inline: true },
                    { name: 'Pet XP', value: `${user.petXP}/${user.petLevel * 50 + 50}`, inline: true }
                );

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const streakBroken = hoursSinceLastFeed > 48;
        if (streakBroken) {
            user.petStreak = 1;
        } else {
            user.petStreak += 1;
        }

        const xpGain = Math.floor(Math.random() * (50 - 25 + 1)) + 25;
        user.petXP += xpGain;
        user.lastPetFeed = now;

        const xpNeeded = user.petLevel * 50 + 50;
        let leveledUp = false;

        while (user.petXP >= xpNeeded) {
            user.petXP -= xpNeeded;
            user.petLevel += 1;
            leveledUp = true;
        }

        await user.save();

        const embed = new EmbedBuilder()
            .setColor('#51cf66')
            .setTitle('🐾 Pet Fed Successfully!')
            .setDescription(`You fed your pet and earned **${xpGain} XP**!`)
            .addFields(
                { name: 'Streak', value: `${user.petStreak} 🔥`, inline: true },
                { name: 'Pet Level', value: `${user.petLevel}`, inline: true },
                { name: 'Pet XP', value: `${user.petXP}/${user.petLevel * 50 + 50}`, inline: true }
            );

        if (leveledUp) {
            embed.addFields({ name: '🎉 Level Up!', value: `Your pet is now level ${user.petLevel}!`, inline: false });
        }

        if (streakBroken) {
            embed.addFields({ name: '⚠️ Streak Reset', value: 'Your streak was reset because you missed a day!', inline: false });
        }

        embed.setFooter({ text: 'Feed your pet every 24 hours to maintain your streak!' });

        await interaction.reply({ embeds: [embed] });
    }
};