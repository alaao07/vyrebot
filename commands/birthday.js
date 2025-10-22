const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Birthday = require('../models/Birthday');

async function displayMonthCalendar(interaction, month, year) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    const birthdays = await Birthday.find({
        guildId: interaction.guild.id,
        month: month
    }).sort({ day: 1 });

    let description = '';
    if (birthdays.length === 0) {
        description = 'No birthdays this month';
    } else {
        birthdays.forEach(bday => {
            description += `**${bday.day}** - <@${bday.userId}>\n`;
        });
    }

    const embed = new EmbedBuilder()
        .setColor(0x9a7f)
        .setTitle(`🗓️ Birthday Calendar - ${monthNames[month - 1]}`)
        .setDescription(description)
        .setFooter({ text: `${birthdays.length} birthday${birthdays.length !== 1 ? 's' : ''} this month` });

    const timestamp = Date.now();
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`bday_prev_${month}_${year}_${timestamp}`)
                .setLabel('◀ Previous')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`bday_next_${month}_${year}_${timestamp}`)
                .setLabel('Next ▶')
                .setStyle(ButtonStyle.Primary)
        );

    if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ embeds: [embed], components: [row] });
    } else {
        await interaction.reply({ embeds: [embed], components: [row] });
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('birthday')
        .setDescription('Birthday management system')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add your birthday')
                .addIntegerOption(option =>
                    option.setName('day')
                        .setDescription('Day of birth (1-31)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(31))
                .addIntegerOption(option =>
                    option.setName('month')
                        .setDescription('Month of birth (1-12)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(12)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove your birthday'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all upcoming birthdays'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('calendar')
                .setDescription('View birthday calendar for a specific month')
                .addIntegerOption(option =>
                    option.setName('month')
                        .setDescription('Month (1-12, default: current month)')
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(12))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'add') {
            const day = interaction.options.getInteger('day');
            const month = interaction.options.getInteger('month');

            const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            if (day > daysInMonth[month - 1]) {
                return interaction.reply({
                    content: `❌ Invalid date! Month ${month} only has ${daysInMonth[month - 1]} days.`,
                    flags: 64
                });
            }

            const existingBirthday = await Birthday.findOne({
                userId: interaction.user.id,
                guildId: interaction.guild.id
            });

            if (existingBirthday) {
                existingBirthday.day = day;
                existingBirthday.month = month;
                await existingBirthday.save();
                
                return interaction.reply({
                    content: `✅ Updated your birthday to ${month}/${day}!`,
                    flags: 64
                });
            }

            await Birthday.create({
                userId: interaction.user.id,
                guildId: interaction.guild.id,
                day: day,
                month: month
            });

            return interaction.reply({
                content: `🎂 Birthday added! Set to ${month}/${day}`,
                flags: 64
            });
        }

        if (subcommand === 'remove') {
            const result = await Birthday.deleteOne({
                userId: interaction.user.id,
                guildId: interaction.guild.id
            });

            if (result.deletedCount === 0) {
                return interaction.reply({
                    content: '❌ You don\'t have a birthday set!',
                    flags: 64
                });
            }

            return interaction.reply({
                content: '✅ Your birthday has been removed.',
                flags: 64
            });
        }

        if (subcommand === 'list') {
            const now = new Date();
            const currentMonth = now.getMonth() + 1;
            const currentDay = now.getDate();

            const birthdays = await Birthday.find({
                guildId: interaction.guild.id
            }).sort({ month: 1, day: 1 });

            if (birthdays.length === 0) {
                return interaction.reply({
                    content: '📅 No birthdays registered in this server yet!',
                    flags: 64
                });
            }

            const upcoming = birthdays
                .filter(b => {
                    if (b.month > currentMonth) return true;
                    if (b.month === currentMonth && b.day >= currentDay) return true;
                    return false;
                })
                .slice(0, 10);

            if (upcoming.length === 0) {
                const nextYear = birthdays.slice(0, 10);
                let description = '🎉 Next year\'s upcoming birthdays:\n\n';
                nextYear.forEach(bday => {
                    description += `**${bday.month}/${bday.day}** - <@${bday.userId}>\n`;
                });

                const embed = new EmbedBuilder()
                    .setColor(0x9a7f)
                    .setTitle('📅 Upcoming Birthdays')
                    .setDescription(description)
                    .setFooter({ text: `${birthdays.length} total birthdays registered` });

                return interaction.reply({ embeds: [embed] });
            }

            let description = '';
            upcoming.forEach(bday => {
                description += `**${bday.month}/${bday.day}** - <@${bday.userId}>\n`;
            });

            const embed = new EmbedBuilder()
                .setColor(0x9a7f)
                .setTitle('📅 Upcoming Birthdays')
                .setDescription(description)
                .setFooter({ text: `${birthdays.length} total birthdays registered` });

            return interaction.reply({ embeds: [embed] });
        }

        if (subcommand === 'calendar') {
            const now = new Date();
            const month = interaction.options.getInteger('month') || (now.getMonth() + 1);
            const year = now.getFullYear();

            await displayMonthCalendar(interaction, month, year);
        }
    },

    displayMonthCalendar
};