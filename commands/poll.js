const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Poll = require('../models/Poll');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Create an interactive poll')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('The poll question')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('option1')
                .setDescription('First option')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('option2')
                .setDescription('Second option')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('option3')
                .setDescription('Third option')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('option4')
                .setDescription('Fourth option')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('option5')
                .setDescription('Fifth option')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('multiple')
                .setDescription('Allow multiple votes per user')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Poll duration in minutes (default: unlimited)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(10080)),

    async execute(interaction) {
        const question = interaction.options.getString('question');
        const allowMultiple = interaction.options.getBoolean('multiple') || false;
        const duration = interaction.options.getInteger('duration');

        const options = [];
        for (let i = 1; i <= 5; i++) {
            const option = interaction.options.getString(`option${i}`);
            if (option) {
                options.push({ text: option, votes: [] });
            }
        }

        const endTime = duration ? new Date(Date.now() + duration * 60000) : null;

        const embed = this.createPollEmbed(question, options, interaction.user, allowMultiple, endTime);
        const row = this.createPollButtons(options, false);

        const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

        const poll = new Poll({
            messageId: message.id,
            channelId: interaction.channelId,
            guildId: interaction.guildId,
            creatorId: interaction.user.id,
            question: question,
            options: options,
            allowMultipleVotes: allowMultiple,
            endTime: endTime,
            isActive: true
        });

        await poll.save();

        if (duration) {
            setTimeout(async () => {
                await this.endPoll(poll, interaction.client);
            }, duration * 60000);
        }
    },

    createPollEmbed(question, options, creator, allowMultiple, endTime) {
        const totalVotes = options.reduce((sum, opt) => sum + opt.votes.length, 0);

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('📊 Poll')
            .setDescription(`**${question}**\n\n${options.map((opt, i) => {
                const percentage = totalVotes > 0 ? ((opt.votes.length / totalVotes) * 100).toFixed(1) : 0;
                const barLength = 20;
                const filledLength = Math.round((opt.votes.length / (totalVotes || 1)) * barLength);
                const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
                
                return `**${i + 1}.** ${opt.text}\n${bar} ${percentage}% (${opt.votes.length} votes)`;
            }).join('\n\n')}`)
            .addFields(
                { name: '📈 Total Votes', value: `${totalVotes}`, inline: true },
                { name: '🎯 Vote Type', value: allowMultiple ? 'Multiple' : 'Single', inline: true }
            )
            .setFooter({ text: `Created by ${creator.username}` })
            .setTimestamp();

        if (endTime) {
            embed.addFields({ name: '⏰ Ends', value: `<t:${Math.floor(endTime.getTime() / 1000)}:R>`, inline: true });
        }

        return embed;
    },

    createPollButtons(options, disabled = false) {
        const row = new ActionRowBuilder();
        
        options.slice(0, 5).forEach((opt, i) => {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`poll_vote_${i}`)
                    .setLabel(`${i + 1}`)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(disabled)
            );
        });

        return row;
    },

    async endPoll(poll, client) {
        poll.isActive = false;
        await poll.save();

        try {
            const channel = await client.channels.fetch(poll.channelId);
            const message = await channel.messages.fetch(poll.messageId);

            const embed = this.createPollEmbed(
                poll.question,
                poll.options,
                { username: 'Poll Creator' },
                poll.allowMultipleVotes,
                null
            );
            
            embed.setColor('#ff6b6b');
            embed.setTitle('📊 Poll (ENDED)');

            const row = this.createPollButtons(poll.options, true);

            await message.edit({ embeds: [embed], components: [row] });
        } catch (error) {
            console.error('Error ending poll:', error);
        }
    }
};