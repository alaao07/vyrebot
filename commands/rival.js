const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
const he = require('he');
const User = require('../models/User');

const activeRivals = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rival')
        .setDescription('Challenge friends to a trivia battle')
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
                .setRequired(true)
                .addChoices(
                    { name: 'Easy', value: 'easy' },
                    { name: 'Medium', value: 'medium' },
                    { name: 'Hard', value: 'hard' }
                ))
        .addStringOption(option =>
            option.setName('category')
                .setDescription('Quiz category')
                .setRequired(false)
                .addChoices(
                    { name: 'General Knowledge', value: '9' },
                    { name: 'Science & Nature', value: '17' },
                    { name: 'Computers', value: '18' },
                    { name: 'Mathematics', value: '19' },
                    { name: 'Sports', value: '21' },
                    { name: 'Geography', value: '22' },
                    { name: 'History', value: '23' },
                    { name: 'Animals', value: '27' }
                ))
        .addUserOption(option =>
            option.setName('player2')
                .setDescription('Challenge a specific player')
                .setRequired(false))
        .addUserOption(option =>
            option.setName('player3')
                .setDescription('Add a third player')
                .setRequired(false))
        .addUserOption(option =>
            option.setName('player4')
                .setDescription('Add a fourth player')
                .setRequired(false))
        .addUserOption(option =>
            option.setName('player5')
                .setDescription('Add a fifth player')
                .setRequired(false)),

    async execute(interaction) {
        const numQuestions = interaction.options.getInteger('questions');
        const difficulty = interaction.options.getString('difficulty');
        const category = interaction.options.getString('category');

        const players = [interaction.user];
        for (let i = 2; i <= 5; i++) {
            const player = interaction.options.getUser(`player${i}`);
            if (player && !player.bot) {
                players.push(player);
            }
        }

        if (players.length > 10) {
            return interaction.reply({ content: 'Maximum 10 players allowed!', ephemeral: true });
        }

        let apiUrl = `https://opentdb.com/api.php?amount=${numQuestions}`;
        if (category) apiUrl += `&category=${category}`;
        apiUrl += `&difficulty=${difficulty}&type=multiple`;

        try {
            const response = await axios.get(apiUrl);
            const questions = response.data.results;

            const sessionId = `${interaction.user.id}_${Date.now()}`;
            const rivalData = {
                sessionId,
                hostId: interaction.user.id,
                players: players.map(p => ({ 
                    user: p, 
                    score: 0, 
                    answers: [],
                    answered: false 
                })),
                questions,
                currentQuestion: 0,
                totalQuestions: numQuestions,
                difficulty,
                channelId: interaction.channelId
            };

            activeRivals.set(sessionId, rivalData);

            const embed = new EmbedBuilder()
                .setColor('#ff6b6b')
                .setTitle('⚔️ Rival Battle Starting!')
                .setDescription(`${interaction.user.username} has started a rival battle!`)
                .addFields(
                    { name: 'Players', value: players.map(p => p.username).join('\n'), inline: true },
                    { name: 'Questions', value: `${numQuestions}`, inline: true },
                    { name: 'Difficulty', value: difficulty.toUpperCase(), inline: true }
                );

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`rival_start_${sessionId}`)
                        .setLabel('Start Battle')
                        .setStyle(ButtonStyle.Success)
                );

            await interaction.reply({ 
                content: players.map(p => `<@${p.id}>`).join(' '),
                embeds: [embed], 
                components: [row] 
            });
        } catch (error) {
            console.error('Error creating rival battle:', error);
            await interaction.reply({ content: 'Failed to create rival battle!', ephemeral: true });
        }
    }
};

module.exports.activeRivals = activeRivals;