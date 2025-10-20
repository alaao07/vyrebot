const Birthday = require('../models/Birthday');

module.exports = {
    async handleButton(interaction) {
        const [, , monthStr] = interaction.customId.split('_');
        const month = parseInt(monthStr);

        const birthdayCommand = require('../commands/birthday');
        await birthdayCommand.displayMonthCalendar(interaction, month);
        await interaction.deferUpdate();
    }
};