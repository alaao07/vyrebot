const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Birthday = require('../models/Birthday');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('birthday')
        .setDescription('Manage birthdays')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a birthday')
                .addIntegerOption(option =>
                    option.setName('month')
                        .setDescription('Birth month (1-12)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(12))
                .addIntegerOption(option =>
                    option.setName('day')
                        .setDescription('Birth day (1-31)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(31))
                .addIntegerOption(option =>
                    option.setName('year')
                        .setDescription('Birth year (optional)')
                        .setRequired(false)
                        .setMinValue(1900)
                        .setMaxValue(2024))
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to add birthday for (admin only)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a birthday')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to remove birthday for')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('View upcoming birthdays'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('calendar')
                .setDescription('View birthday calendar')),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'add') {
            await this.addBirthday(interaction);
        } else if (subcommand === 'remove') {
            await this.removeBirthday(interaction);
        } else if (subcommand === 'list') {
            await this.listBirthdays(interaction);
        } else if (subcommand === 'calendar') {
            await this.showCalendar(interaction);
        }
    },

    async addBirthday(interaction) {
        const month = interaction.options.getInteger('month');
        const day = interaction.options.getInteger('day');
        const year = interaction.options.getInteger('year');
        const targetUser = interaction.options.getUser('user') || interaction.user;

        if (targetUser.id !== interaction.user.id && !interaction.member.permissions.has('Administrator')) {
            return interaction.reply({ content: 'You need administrator permissions to add birthdays for other users!', ephemeral: true });
        }

        const daysInMonth = new Date(2024, month, 0).getDate();
        if (day > daysInMonth) {
            return interaction.reply({ content: `Invalid day for month ${month}! This month has only ${daysInMonth} days.`, ephemeral: true });
        }

        try {
            await Birthday.findOneAndUpdate(
                { userId: targetUser.id, guildId: interaction.guildId },
                {
                    userId: targetUser.id,
                    guildId: interaction.guildId,
                    username: targetUser.username,
                    month: month,
                    day: day,
                    year: year,
                    notificationsSent: {
                        oneDayBefore: false,
                        oneHourBefore: false,
                        onBirthday: false,
                        lastNotificationYear: null
                    }
                },
                { upsert: true, new: true }
            );

            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                                'July', 'August', 'September', 'October', 'November', 'December'];

            const embed = new EmbedBuilder()
                .setColor('#51cf66')
                .setTitle('🎂 Birthday Added!')
                .setDescription(`Birthday for ${targetUser.username} has been set!`)
                .addFields(
                    { name: 'Date', value: `${monthNames[month - 1]} ${day}${year ? `, ${year}` : ''}`, inline: true },
                    { name: 'User', value: targetUser.username, inline: true }
                )
                .setThumbnail(targetUser.displayAvatarURL())
                .setFooter({ text: 'You will receive reminders 1 day and 1 hour before!' });

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error adding birthday:', error);
            await interaction.reply({ content: 'Failed to add birthday. Please try again!', ephemeral: true });
        }
    },

    async removeBirthday(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;

        if (targetUser.id !== interaction.user.id && !interaction.member.permissions.has('Administrator')) {
            return interaction.reply({ content: 'You need administrator permissions to remove birthdays for other users!', ephemeral: true });
        }

        const result = await Birthday.findOneAndDelete({
            userId: targetUser.id,
            guildId: interaction.guildId
        });

        if (!result) {
            return interaction.reply({ content: `No birthday found for ${targetUser.username}!`, ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor('#ff6b6b')
            .setTitle('🗑️ Birthday Removed')
            .setDescription(`Birthday for ${targetUser.username} has been removed.`);

        await interaction.reply({ embeds: [embed] });
    },

    async listBirthdays(interaction) {
        const birthdays = await Birthday.find({ guildId: interaction.guildId }).sort({ month: 1, day: 1 });

        if (birthdays.length === 0) {
            return interaction.reply({ content: 'No birthdays have been added yet!', ephemeral: true });
        }

        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentDay = now.getDate();

        const upcoming = birthdays
            .map(b => {
                const isToday = b.month === currentMonth && b.day === currentDay;
                const daysUntil = this.calculateDaysUntil(b.month, b.day);
                return { ...b.toObject(), isToday, daysUntil };
            })
            .sort((a, b) => a.daysUntil - b.daysUntil)
            .slice(0, 10);

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🎂 Upcoming Birthdays')
            .setDescription(upcoming.map(b => {
                const emoji = b.isToday ? '🎉' : '🎂';
                const status = b.isToday ? '**TODAY!**' : `in ${b.daysUntil} day${b.daysUntil !== 1 ? 's' : ''}`;
                return `${emoji} **${b.username}** - ${monthNames[b.month - 1]} ${b.day} (${status})`;
            }).join('\n'))
            .setFooter({ text: `${birthdays.length} total birthdays registered` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async showCalendar(interaction) {
        const currentMonth = new Date().getMonth() + 1;
        await this.displayMonthCalendar(interaction, currentMonth);
    },

    async displayMonthCalendar(interaction, month) {
        const birthdays = await Birthday.find({ 
            guildId: interaction.guildId,
            month: month 
        }).sort({ day: 1 });

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                            'July', 'August', 'September', 'October', 'November', 'December'];

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`🗓️ Birthday Calendar - ${monthNames[month - 1]}`)
            .setDescription(birthdays.length > 0 
                ? birthdays.map(b => `**${b.day}** - ${b.username}`).join('\n')
                : 'No birthdays this month')
            .setFooter({ text: `Use the buttons to navigate months` });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`birthday_cal_${month === 1 ? 12 : month - 1}`)
                    .setLabel('◀️ Previous')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`birthday_cal_${new Date().getMonth() + 1}`)
                    .setLabel('Today')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`birthday_cal_${month === 12 ? 1 : month + 1}`)
                    .setLabel('Next ▶️')
                    .setStyle(ButtonStyle.Primary)
            );

        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({ embeds: [embed], components: [row] });
        } else {
            await interaction.reply({ embeds: [embed], components: [row] });
        }
    },

    calculateDaysUntil(month, day) {
        const now = new Date();
        const currentYear = now.getFullYear();
        let birthdayThisYear = new Date(currentYear, month - 1, day);

        if (birthdayThisYear < now) {
            birthdayThisYear = new Date(currentYear + 1, month - 1, day);
        }

        const diffTime = birthdayThisYear - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays;
    }
};