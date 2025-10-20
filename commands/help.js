const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Get help with Vyre Bot commands'),

    async execute(interaction) {
        const mainEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('📚 Vyre Bot - Help Guide')
            .setDescription('Welcome to Vyre Bot! Your ultimate utility companion for learning and fun.')
            .addFields(
                { 
                    name: '🎓 Study Commands', 
                    value: '`/study` - Take trivia quizzes and earn XP\n`/leaderboard` - View rankings\n`/daily` - Claim daily learning streak', 
                    inline: false 
                },
                { 
                    name: '🐾 Pet Commands', 
                    value: '`/petfeed` - Feed your pet daily to maintain streak', 
                    inline: false 
                },
                { 
                    name: '⚔️ Competitive Commands', 
                    value: '`/rival` - Challenge friends to battles\n`/matchmaking` - Find random opponents', 
                    inline: false 
                },
                { 
                    name: '🤖 AI Commands', 
                    value: '`/ask` - Ask Gemini AI any question', 
                    inline: false 
                },
                {
                    name: '📊 Profile Command',
                    value: '`/profile` - View your stats and achievements',
                    inline: false
                }
            )
            .setFooter({ text: 'Use the buttons below for detailed command information' });

        const studyEmbed = new EmbedBuilder()
            .setColor('#51cf66')
            .setTitle('🎓 Study System')
            .setDescription('Learn and earn XP through trivia quizzes!')
            .addFields(
                { 
                    name: '/study', 
                    value: '**Options:**\n• Questions: 5, 7, or 10\n• Category: Various topics\n• Difficulty: Easy, Medium, Hard\n• Mode: Normal or Swift\n\n**XP Rewards:**\n• Correct: +3 XP\n• Wrong: -3 XP\n• Max: 15 (5q), 21 (7q), 30 (10q)', 
                    inline: false 
                },
                { 
                    name: '/leaderboard', 
                    value: 'View rankings across different categories with pagination', 
                    inline: false 
                },
                { 
                    name: '/daily', 
                    value: 'Claim daily rewards:\n• Base: 10 XP\n• Bonus: +10 XP per 7-day milestone\n• Must complete quiz within 24h', 
                    inline: false 
                }
            );

        const petEmbed = new EmbedBuilder()
            .setColor('#ffd43b')
            .setTitle('🐾 Pet System')
            .setDescription('Take care of your virtual pet and build streaks!')
            .addFields(
                { 
                    name: '/petfeed', 
                    value: '**Features:**\n• Feed once every 24 hours\n• Earn 25-50 XP per feed\n• Level up your pet\n• Maintain daily streak\n• Streak resets if missed 48h\n\n**Leveling:**\n• Each level requires +50 XP\n• Level cap increases with pet level', 
                    inline: false 
                }
            );

        const competitiveEmbed = new EmbedBuilder()
            .setColor('#ff6b6b')
            .setTitle('⚔️ Competitive Mode')
            .setDescription('Challenge others and climb the ranks!')
            .addFields(
                { 
                    name: '/rival', 
                    value: '**Features:**\n• Challenge up to 10 players\n• Host picks difficulty & category\n• Secret answer selection\n• Winner gets 1.3x XP bonus\n• Anti-farming protection', 
                    inline: false 
                },
                { 
                    name: '/matchmaking', 
                    value: '**Features:**\n• Find random opponents\n• Match by preferences\n• Auto-matching system\n• 5-minute queue timeout', 
                    inline: false 
                }
            );

        const aiEmbed = new EmbedBuilder()
            .setColor('#4285f4')
            .setTitle('🤖 AI Integration')
            .setDescription('Powered by Google Gemini AI')
            .addFields(
                { 
                    name: '/ask', 
                    value: '**Features:**\n• Natural language processing\n• General knowledge queries\n• Educational assistance\n• Automatic long response handling\n\n**Example:** `/ask What is quantum computing?`', 
                    inline: false 
                }
            );

        const pages = [mainEmbed, studyEmbed, petEmbed, competitiveEmbed, aiEmbed];
        let currentPage = 0;

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('help_prev')
                    .setLabel('◀️ Previous')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('help_next')
                    .setLabel('Next ▶️')
                    .setStyle(ButtonStyle.Primary)
            );

        const message = await interaction.reply({ 
            embeds: [pages[currentPage]], 
            components: [row], 
            fetchReply: true 
        });

        const collector = message.createMessageComponentCollector({ time: 300000 });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: 'These buttons are not for you!', ephemeral: true });
            }

            if (i.customId === 'help_next') {
                currentPage++;
            } else if (i.customId === 'help_prev') {
                currentPage--;
            }

            const newRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('help_prev')
                        .setLabel('◀️ Previous')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage === 0),
                    new ButtonBuilder()
                        .setCustomId('help_next')
                        .setLabel('Next ▶️')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage === pages.length - 1)
                );

            await i.update({ embeds: [pages[currentPage]], components: [newRow] });
        });

        collector.on('end', () => {
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('help_prev')
                        .setLabel('◀️ Previous')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('help_next')
                        .setLabel('Next ▶️')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true)
                );

            message.edit({ components: [disabledRow] }).catch(() => {});
        });
    }
};