const { EmbedBuilder } = require('discord.js');
const User = require('../models/User');
const he = require('he');
const studyCommand = require('../commands/study');

module.exports = {
    async handleButton(interaction) {
        const [, userId, answerIndex] = interaction.customId.split('_');

        if (interaction.user.id !== userId) {
            return interaction.reply({ content: 'This is not your quiz!', ephemeral: true });
        }

        const quizData = studyCommand.activeQuizzes.get(userId);
        if (!quizData) {
            return interaction.reply({ content: 'Quiz session expired!', ephemeral: true });
        }

        const selectedAnswer = quizData.answers[parseInt(answerIndex)];
        const isCorrect = selectedAnswer === quizData.correctAnswer;
        const responseTime = Date.now() - quizData.questionStartTime;

        quizData.answerTimes.push(responseTime);

        if (isCorrect) {
            quizData.score += 3;
            quizData.correctAnswers++;
        } else {
            quizData.score -= 3;
        }

        quizData.currentQuestion++;

        const resultEmbed = new EmbedBuilder()
            .setColor(isCorrect ? '#00ff00' : '#ff0000')
            .setTitle(isCorrect ? '✅ Correct!' : '❌ Wrong!')
            .setDescription(`The correct answer was: **${he.decode(quizData.correctAnswer)}**`)
            .addFields({ name: 'Response Time', value: `${(responseTime / 1000).toFixed(2)}s`, inline: true });

        await interaction.update({ embeds: [resultEmbed], components: [] });

        if (quizData.currentQuestion < quizData.totalQuestions) {
            setTimeout(async () => {
                await studyCommand.showQuestion(interaction, quizData);
            }, 2000);
        } else {
            setTimeout(async () => {
                await this.endQuiz(interaction, quizData);
            }, 2000);
        }
    },

    async endQuiz(interaction, quizData) {
        let earnedXP = Math.max(0, quizData.score);

        if (quizData.event && quizData.event.eventType === 'xp_multiplier') {
            earnedXP = Math.ceil(earnedXP * quizData.event.multiplier);
        }

        const avgResponseTime = quizData.answerTimes.reduce((a, b) => a + b, 0) / quizData.answerTimes.length;

        let user = await User.findOne({ userId: interaction.user.id });
        if (!user) {
            user = new User({ 
                userId: interaction.user.id,
                username: interaction.user.username
            });
        }

        user.studyXP += earnedXP;
        user.questionsAnswered += quizData.totalQuestions;
        user.correctAnswers += quizData.correctAnswers;
        user.lastQuizCompleted = new Date();
        user.lastActivity = new Date();

        if (quizData.mode === 'swift' && avgResponseTime < 3000 && quizData.correctAnswers === quizData.totalQuestions) {
            user.swiftWins += 1;
        }

        await user.save();

        const finalEmbed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('📚 Quiz Complete!')
            .setDescription(`Great job, ${interaction.user.username}!`)
            .addFields(
                { name: 'Questions Answered', value: `${quizData.totalQuestions}`, inline: true },
                { name: 'Correct Answers', value: `${quizData.correctAnswers}`, inline: true },
                { name: 'Accuracy', value: `${((quizData.correctAnswers / quizData.totalQuestions) * 100).toFixed(1)}%`, inline: true },
                { name: 'XP Earned', value: `+${earnedXP} XP`, inline: true },
                { name: 'Total XP', value: `${user.studyXP} XP`, inline: true },
                { name: 'Avg Response Time', value: `${(avgResponseTime / 1000).toFixed(2)}s`, inline: true }
            );

        if (quizData.event && quizData.event.eventType === 'xp_multiplier') {
            finalEmbed.addFields({ name: '🎉 Event Bonus', value: `${quizData.event.multiplier}x XP Applied!`, inline: false });
        }

        if (quizData.mode === 'swift' && avgResponseTime < 3000 && quizData.correctAnswers === quizData.totalQuestions) {
            finalEmbed.addFields({ name: '⚡ Swift Victory!', value: 'Perfect score with lightning speed!', inline: false });
        }

        finalEmbed.setFooter({ text: 'Use /daily to claim your learning streak!' });

        await interaction.editReply({ embeds: [finalEmbed], components: [] });
        studyCommand.activeQuizzes.delete(interaction.user.id);
    }
};