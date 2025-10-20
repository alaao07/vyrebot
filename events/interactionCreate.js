module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction, client);
            } catch (error) {
                console.error(error);
                const errorMessage = { content: 'There was an error executing this command!', ephemeral: true };
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            }
        } else if (interaction.isButton()) {
            const buttonId = interaction.customId;
            
            if (buttonId.startsWith('lb_')) {
                const leaderboardHandler = require('../utils/leaderboardHandler');
                await leaderboardHandler.handleButton(interaction);
            } else if (buttonId.startsWith('quiz_')) {
                const quizHandler = require('../utils/quizHandler');
                await quizHandler.handleButton(interaction);
            } else if (buttonId.startsWith('rival_')) {
                const rivalHandler = require('../utils/rivalHandler');
                await rivalHandler.handleButton(interaction);
            } else if (buttonId.startsWith('match_')) {
                const matchHandler = require('../utils/matchHandler');
                await matchHandler.handleButton(interaction);
            } else if (buttonId.startsWith('poll_')) {
                const pollHandler = require('../utils/pollHandler');
                await pollHandler.handleButton(interaction);
            } else if (buttonId.startsWith('birthday_')) {
                const birthdayHandler = require('../utils/birthdayHandler');
                await birthdayHandler.handleButton(interaction);
            } else if (buttonId.startsWith('todo_')) {
                const todoHandler = require('../utils/todoHandler');
                await todoHandler.handleButton(interaction);
            }
        }
    }
};