const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
const he = require('he');
const User = require('../models/User');
const Event = require('../models/Event');

const activeQuizzes = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('study')
        .setDescription('Start a trivia quiz to earn XP')
        .addIntegerOption(option =>
            option.setName('questions')
                .setDescription('Number of questions (5, 7, or 10)')
                .setRequired(true)
                .addChoices(
                    { name: '5 Questions (15 XP)', value: 5 },
                    { name: '7 Questions (21 XP)', value: 7 },
                    { name: '10 Questions (30 XP)', value: 10 }
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
        .addStringOption(option =>
            option.setName('difficulty')
                .setDescription('Quiz difficulty')
                .setRequired(false)
                .addChoices(
                    { name: 'Easy', value: 'easy' },
                    { name: 'Medium', value: 'medium' },
                    { name: 'Hard', value: 'hard' }
                ))
        .addStringOption(option =>
            option.setName('mode')
                .setDescription('Quiz mode')
                .setRequired(false)
                .addChoices(
                    { name: 'Normal', value: 'normal' },
                    { name: 'Swift (Fastest Answer)', value: 'swift' }
                )),

    async execute(interaction) {
        const numQuestions = interaction.options.getInteger('questions');
        const category = interaction.options.getString('category');
        const difficulty = interaction.options.getString('difficulty');
        const mode = interaction.options.getString('mode') || 'normal';

        let apiUrl = `https://opentdb.com/api.php?amount=${numQuestions}`;
        if (category) apiUrl += `&category=${category}`;
        if (difficulty) apiUrl += `&difficulty=${difficulty}`;
        apiUrl += '&type=multiple';

        try {
            const response = await axios.get(apiUrl);
            const questions = response.data.results;

            if (questions.length === 0) {
                return interaction.reply({ content: 'No questions available for this category/difficulty!', ephemeral: true });
            }

            const activeEvent = await Event.findOne({
                isActive: true,
                startDate: { $lte: new Date() },
                endDate: { $gte: new Date() }
            });

            const quizData = {
                userId: interaction.user.id,
                questions: questions,
                currentQuestion: 0,
                score: 0,
                correctAnswers: 0,
                totalQuestions: numQuestions,
                maxXP: numQuestions === 5 ? 15 : numQuestions === 7 ? 21 : 30,
                mode: mode,
                startTime: Date.now(),
                answerTimes: [],
                event: activeEvent
            };

            activeQuizzes.set(interaction.user.id, quizData);

            await this.showQuestion(interaction, quizData);
        } catch (error) {
            console.error('Error fetching questions:', error);
            await interaction.reply({ content: 'Failed to fetch quiz questions. Please try again!', ephemeral: true });
        }
    },

    async showQuestion(interaction, quizData) {
        const question = quizData.questions[quizData.currentQuestion];
        const answers = [...question.incorrect_answers, question.correct_answer]
            .sort(() => Math.random() - 0.5);

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`Question ${quizData.currentQuestion + 1}/${quizData.totalQuestions}`)
            .setDescription(he.decode(question.question))
            .addFields(
                { name: 'Category', value: he.decode(question.category), inline: true },
                { name: 'Difficulty', value: question.difficulty.toUpperCase(), inline: true },
                { name: 'Score', value: `${quizData.score}/${quizData.maxXP} XP`, inline: true }
            );

        if (quizData.mode === 'swift') {
            embed.setFooter({ text: '⚡ Swift Mode: Answer as fast as possible!' });
        }

        if (quizData.event && quizData.event.eventType === 'xp_multiplier') {
            embed.addFields({ name: '🎉 Event Active', value: `${quizData.event.multiplier}x XP!`, inline: false });
        }

        const row = new ActionRowBuilder();
        answers.forEach((answer, index) => {
            const button = new ButtonBuilder()
                .setCustomId(`quiz_${interaction.user.id}_${index}_${Date.now()}`)
                .setLabel(he.decode(answer))
                .setStyle(ButtonStyle.Primary);
            row.addComponents(button);
        });

        quizData.answers = answers;
        quizData.correctAnswer = question.correct_answer;
        quizData.questionStartTime = Date.now();

        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({ embeds: [embed], components: [row] });
        } else {
            await interaction.reply({ embeds: [embed], components: [row] });
        }
    }
};

module.exports.activeQuizzes = activeQuizzes;