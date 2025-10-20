const Poll = require('../models/Poll');
const pollCommand = require('../commands/poll');

module.exports = {
    async handleButton(interaction) {
        const [, action, index] = interaction.customId.split('_');

        if (action !== 'vote') return;

        const poll = await Poll.findOne({ messageId: interaction.message.id });

        if (!poll || !poll.isActive) {
            return interaction.reply({ content: 'This poll has ended!', ephemeral: true });
        }

        const optionIndex = parseInt(index);
        const userId = interaction.user.id;

        const hasVoted = poll.options.some(opt => opt.votes.includes(userId));

        if (hasVoted && !poll.allowMultipleVotes) {
            poll.options.forEach(opt => {
                const voteIndex = opt.votes.indexOf(userId);
                if (voteIndex > -1) {
                    opt.votes.splice(voteIndex, 1);
                }
            });
        }

        const alreadyVotedThisOption = poll.options[optionIndex].votes.includes(userId);

        if (alreadyVotedThisOption) {
            const voteIndex = poll.options[optionIndex].votes.indexOf(userId);
            poll.options[optionIndex].votes.splice(voteIndex, 1);
            await poll.save();
            await interaction.reply({ content: 'Vote removed!', ephemeral: true });
        } else {
            poll.options[optionIndex].votes.push(userId);
            await poll.save();
            await interaction.reply({ content: `Voted for: ${poll.options[optionIndex].text}`, ephemeral: true });
        }

        const creator = await interaction.client.users.fetch(poll.creatorId);
        const embed = pollCommand.createPollEmbed(poll.question, poll.options, creator, poll.allowMultipleVotes, poll.endTime);
        const row = pollCommand.createPollButtons(poll.options, false);

        await interaction.message.edit({ embeds: [embed], components: [row] });
    }
};