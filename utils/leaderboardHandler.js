module.exports = {
    async handleButton(interaction) {
        const [, type, pageStr] = interaction.customId.split('_');
        const page = parseInt(pageStr);

        const leaderboardCommand = require('../commands/leaderboard');
        await leaderboardCommand.showLeaderboard(interaction, type, page);
        
        await interaction.deferUpdate();
    }
};