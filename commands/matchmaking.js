const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const matchmakingQueue = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('matchmaking')
        .setDescription('Find a random opponent for a quiz battle')
        .addIntegerOption(option =>
            option.setName('questions')
                .setDescription('Number of questions')
                .setRequired(true)
                .addChoices(
                    { name: '5 Questions', value: 5 },
                    { name: '7 Questions', value: 7 },
                    { name: '10 Questions', value: 10 }
                ))
        .addStringOption(option =>
            option.setName('difficulty')
                .setDescription('Quiz difficulty')
                .setRequired(false)
                .addChoices(
                    { name: 'Easy', value: 'easy' },
                    { name: 'Medium', value: 'medium' },
                    { name: 'Hard', value: 'hard' }
                )),

    async execute(interaction) {
        const numQuestions = interaction.options.getInteger('questions');
        const difficulty = interaction.options.getString('difficulty') || 'medium';

        const queueKey = `${numQuestions}_${difficulty}`;
        
        if (!matchmakingQueue.has(queueKey)) {
            matchmakingQueue.set(queueKey, []);
        }

        const queue = matchmakingQueue.get(queueKey);

        const alreadyQueued = queue.find(q => q.userId === interaction.user.id);
        if (alreadyQueued) {
            return interaction.reply({ content: 'You are already in the matchmaking queue!', ephemeral: true });
        }

        if (queue.length > 0) {
            const opponent = queue.shift();

            const embed = new EmbedBuilder()
                .setColor('#51cf66')
                .setTitle('🎯 Match Found!')
                .setDescription(`**${interaction.user.username}** joined **${opponent.username}** in a match!`)
                .addFields(
                    { name: 'Questions', value: `${numQuestions}`, inline: true },
                    { name: 'Difficulty', value: difficulty.toUpperCase(), inline: true }
                );

            await interaction.reply({ embeds: [embed] });

            setTimeout(async () => {
                const rivalCommand = require('./rival');
                
                const fakeInteraction = {
                    user: interaction.user,
                    channelId: interaction.channelId,
                    options: {
                        getInteger: (name) => name === 'questions' ? numQuestions : null,
                        getString: (name) => name === 'difficulty' ? difficulty : null,
                        getUser: (name) => name === 'player2' ? opponent.user : null
                    },
                    reply: async (data) => interaction.channel.send(data)
                };

                await rivalCommand.execute(fakeInteraction);
            }, 2000);

        } else {
            queue.push({
                userId: interaction.user.id,
                username: interaction.user.username,
                user: interaction.user,
                timestamp: Date.now()
            });

            const embed = new EmbedBuilder()
                .setColor('#339af0')
                .setTitle('🔍 Finding Match...')
                .setDescription('Searching for an opponent with similar preferences...')
                .addFields(
                    { name: 'Questions', value: `${numQuestions}`, inline: true },
                    { name: 'Difficulty', value: difficulty.toUpperCase(), inline: true }
                )
                .setFooter({ text: 'You will be notified when a match is found!' });

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`match_cancel_${queueKey}`)
                        .setLabel('Cancel Queue')
                        .setStyle(ButtonStyle.Danger)
                );

            await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

            setTimeout(() => {
                const stillInQueue = queue.find(q => q.userId === interaction.user.id);
                if (stillInQueue) {
                    queue.splice(queue.indexOf(stillInQueue), 1);
                }
            }, 300000);
        }
    }
};

module.exports.matchmakingQueue = matchmakingQueue;