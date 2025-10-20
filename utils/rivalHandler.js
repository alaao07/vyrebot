const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const User = require('../models/User');
const he = require('he');
const rivalCommand = require('../commands/rival');

module.exports = {
    async handleButton(interaction) {
        const parts = interaction.customId.split('_');
        const action = parts[1];
        const sessionId = parts[2];

        const rivalData = rivalCommand.activeRivals.get(sessionId);
        if (!rivalData) {
            return interaction.reply({ content: 'This rival session has expired!', ephemeral: true });
        }

        if (action === 'start') {
            if (interaction.user.id !== rivalData.hostId) {
                return interaction.reply({ content: 'Only the host can start the battle!', ephemeral: true });
            }
            await this.showQuestion(interaction, rivalData);
        } else if (action === 'answer') {
            await this.handleAnswer(interaction, rivalData, parts[3]);
        }
    },

    async showQuestion(interaction, rivalData) {
        const question = rivalData.questions[rivalData.currentQuestion];
        const answers = [...question.incorrect_answers, question.correct_answer]
            .sort(() => Math.random() - 0.5);

        rivalData.currentAnswers = answers;
        rivalData.correctAnswer = question.correct_answer;
        rivalData.players.forEach(p => p.answered = false);

        const embed = new EmbedBuilder()
            .setColor('#ff6b6b')
            .setTitle(`⚔️ Question ${rivalData.currentQuestion + 1}/${rivalData.totalQuestions}`)
            .setDescription(he.decode(question.question))
            .addFields(
                { name: 'Category', value: he.decode(question.category), inline: true },
                { name: 'Difficulty', value: question.difficulty.toUpperCase(), inline: true }
            );

        const row = new ActionRowBuilder();
        answers.forEach((answer, index) => {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`rival_answer_${rivalData.sessionId}_${index}`)
                    .setLabel(he.decode(answer))
                    .setStyle(ButtonStyle.Primary)
            );
        });

        await interaction.update({ embeds: [embed], components: [row] });
    },

    async handleAnswer(interaction, rivalData, answerIndex) {
        const player = rivalData.players.find(p => p.user.id === interaction.user.id);
        if (!player) {
            return interaction.reply({ content: 'You are not in this battle!', ephemeral: true });
        }

        if (player.answered) {
            return interaction.reply({ content: 'You already answered!', ephemeral: true });
        }

        const selectedAnswer = rivalData.currentAnswers[parseInt(answerIndex)];
        const isCorrect = selectedAnswer === rivalData.correctAnswer;

        player.answered = true;
        player.answers.push(isCorrect);
        
        if (isCorrect) {
            player.score += 3;
        }

        await interaction.reply({ 
            content: isCorrect ? '✅ Correct!' : `❌ Wrong! The answer was: ${he.decode(rivalData.correctAnswer)}`, 
            ephemeral: true 
        });

        const allAnswered = rivalData.players.every(p => p.answered);
        
        if (allAnswered) {
            rivalData.currentQuestion++;
            
            if (rivalData.currentQuestion < rivalData.totalQuestions) {
                setTimeout(async () => {
                    const channel = await interaction.client.channels.fetch(rivalData.channelId);
                    const message = await channel.messages.fetch(interaction.message.id);
                    await this.showQuestion({ update: message.edit.bind(message) }, rivalData);
                }, 3000);
            } else {
                setTimeout(async () => {
                    await this.endRival(interaction, rivalData);
                }, 3000);
            }
        }
    },

    async endRival(interaction, rivalData) {
        rivalData.players.sort((a, b) => b.score - a.score);
        const winner = rivalData.players[0];

        const maxXP = rivalData.totalQuestions === 5 ? 15 : rivalData.totalQuestions === 7 ? 21 : 30;

        for (const player of rivalData.players) {
            let user = await User.findOne({ userId: player.user.id });
            if (!user) {
                user = new User({
                    userId: player.user.id,
                    username: player.user.username
                });
            }

            let earnedXP = Math.max(0, player.score);
            if (player.user.id === winner.user.id) {
                earnedXP = Math.ceil(earnedXP * 1.3);
            }

            user.studyXP += earnedXP;
            user.questionsAnswered += rivalData.totalQuestions;
            user.correctAnswers += player.answers.filter(a => a).length;
            
            if (player.user.id === winner.user.id) {
                user.rivalWins += 1;
            }

            await user.save();
        }

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('⚔️ Rival Battle Complete!')
            .setDescription(`**Winner: ${winner.user.username}** 🏆\n\n**Final Scores:**\n${rivalData.players.map((p, i) => 
                `${i + 1}. ${p.user.username}: ${p.score} points`
            ).join('\n')}`);

        const channel = await interaction.client.channels.fetch(rivalData.channelId);
        await channel.send({ embeds: [embed] });

        rivalCommand.activeRivals.delete(rivalData.sessionId);
    }
};