const { EmbedBuilder } = require('discord.js');

module.exports = {
    async handleButton(interaction) {
        const [, action, queueKey] = interaction.customId.split('_');

        if (action === 'cancel') {
            const embed = new EmbedBuilder()
                .setColor('#ff6b6b')
                .setTitle('❌ Queue Cancelled')
                .setDescription('You have left the matchmaking queue.');

            await interaction.update({ embeds: [embed], components: [] });
        }
    }
};