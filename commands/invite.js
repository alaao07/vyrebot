const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Get the bot invite link'),

    async execute(interaction) {
        const inviteUrl = 'https://discord.com/oauth2/authorize?client_id=1410210510045188206&permissions=1126037346176064&integration_type=0&scope=bot';

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🎉 Invite Vyre Bot to Your Server!')
            .setDescription('Click the button below to invite me to your Discord server.')
            .addFields(
                { name: '✨ Features', value: '• Study System with Quizzes\n• Virtual Pet System\n• Rival Battles & Matchmaking\n• Todo Lists & Reminders\n• Birthday Tracking\n• Polls & More!', inline: false },
                { name: '🔒 Permissions', value: 'The bot requires certain permissions to function properly. All requested permissions are necessary for bot features.', inline: false }
            )
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setFooter({ text: `Requested by ${interaction.user.username}` })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Invite Bot')
                    .setStyle(ButtonStyle.Link)
                    .setURL(inviteUrl)
                    .setEmoji('🤖'),
                new ButtonBuilder()
                    .setLabel('Support Server')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://discord.gg/your-support-server')
                    .setEmoji('💬')
            );

        await interaction.reply({ embeds: [embed], components: [row] });
    }
};