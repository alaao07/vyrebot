const Birthday = require('../models/Birthday');

module.exports = {
    async handleButton(interaction) {
        const [, , monthStr] = interaction.customId.split('_');
        const month = parseInt(monthStr);

        await interaction.deferUpdate();

        const birthdayCommand = require('../commands/birthday');
        await birthdayCommand.displayMonthCalendar(interaction, month);
    }
};
