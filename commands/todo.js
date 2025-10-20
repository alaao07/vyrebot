const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const Todo = require('../models/Todo');
const crypto = require('crypto');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('todo')
        .setDescription('Manage your todo list')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a task to your todo list')
                .addStringOption(option =>
                    option.setName('task')
                        .setDescription('The task to add')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('priority')
                        .setDescription('Task priority')
                        .setRequired(false)
                        .addChoices(
                            { name: 'Low', value: 'low' },
                            { name: 'Medium', value: 'medium' },
                            { name: 'High', value: 'high' }
                        ))
                .addIntegerOption(option =>
                    option.setName('reminder')
                        .setDescription('Reminder in minutes (optional)')
                        .setRequired(false)
                        .setMinValue(1)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('View your todo list'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription('Clear completed tasks')),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'add') {
            await this.addTask(interaction);
        } else if (subcommand === 'list') {
            await this.showList(interaction);
        } else if (subcommand === 'clear') {
            await this.clearCompleted(interaction);
        }
    },

    async addTask(interaction) {
        const taskText = interaction.options.getString('task');
        const priority = interaction.options.getString('priority') || 'medium';
        const reminderMinutes = interaction.options.getInteger('reminder');

        const taskId = crypto.randomBytes(8).toString('hex');
        const reminder = reminderMinutes ? new Date(Date.now() + reminderMinutes * 60000) : null;

        let todo = await Todo.findOne({ userId: interaction.user.id, guildId: interaction.guildId });

        if (!todo) {
            todo = new Todo({
                userId: interaction.user.id,
                guildId: interaction.guildId,
                tasks: []
            });
        }

        todo.tasks.push({
            id: taskId,
            text: taskText,
            completed: false,
            priority: priority,
            reminder: reminder,
            reminderSent: false,
            createdAt: new Date()
        });

        await todo.save();

        const priorityEmojis = { low: '🟢', medium: '🟡', high: '🔴' };

        const embed = new EmbedBuilder()
            .setColor('#51cf66')
            .setTitle('✅ Task Added!')
            .setDescription(`**${taskText}**`)
            .addFields(
                { name: 'Priority', value: `${priorityEmojis[priority]} ${priority.toUpperCase()}`, inline: true },
                { name: 'Tasks', value: `${todo.tasks.filter(t => !t.completed).length} active`, inline: true }
            );

        if (reminder) {
            embed.addFields({ name: '⏰ Reminder', value: `<t:${Math.floor(reminder.getTime() / 1000)}:R>`, inline: true });
        }

        await interaction.reply({ embeds: [embed] });
    },

    async showList(interaction) {
        const todo = await Todo.findOne({ userId: interaction.user.id, guildId: interaction.guildId });

        if (!todo || todo.tasks.length === 0) {
            return interaction.reply({ content: 'Your todo list is empty! Use `/todo add` to add tasks.', ephemeral: true });
        }

        await this.displayTodoList(interaction, todo, 0);
    },

    async displayTodoList(interaction, todo, page = 0) {
        const tasksPerPage = 5;
        const activeTasks = todo.tasks.filter(t => !t.completed);
        const completedTasks = todo.tasks.filter(t => t.completed);
        
        const allTasks = [...activeTasks, ...completedTasks];
        const totalPages = Math.ceil(allTasks.length / tasksPerPage);
        const start = page * tasksPerPage;
        const end = start + tasksPerPage;
        const displayTasks = allTasks.slice(start, end);

        const priorityEmojis = { low: '🟢', medium: '🟡', high: '🔴' };

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('📝 Your Todo List')
            .setDescription(displayTasks.map(task => {
                const checkbox = task.completed ? '✅' : '⬜';
                const strikethrough = task.completed ? '~~' : '';
                const priority = priorityEmojis[task.priority];
                const reminder = task.reminder && !task.reminderSent ? '⏰' : '';
                
                return `${checkbox} ${priority} ${strikethrough}**${task.text}**${strikethrough} ${reminder}`;
            }).join('\n\n') || 'No tasks')
            .addFields(
                { name: '📊 Statistics', value: `Active: ${activeTasks.length} | Completed: ${completedTasks.length}`, inline: false }
            )
            .setFooter({ text: `Page ${page + 1}/${totalPages || 1}` });

        const actionRow = new ActionRowBuilder();
        
        displayTasks.forEach(task => {
            if (actionRow.components.length < 5) {
                actionRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`todo_toggle_${task.id}`)
                        .setLabel(task.completed ? 'Undo' : 'Done')
                        .setStyle(task.completed ? ButtonStyle.Secondary : ButtonStyle.Success)
                        .setEmoji(task.completed ? '↩️' : '✅')
                );
            }
        });

        const navRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`todo_page_${Math.max(0, page - 1)}`)
                    .setLabel('◀️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === 0),
                new ButtonBuilder()
                    .setCustomId(`todo_refresh`)
                    .setLabel('🔄 Refresh')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`todo_page_${Math.min(totalPages - 1, page + 1)}`)
                    .setLabel('▶️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page >= totalPages - 1),
                new ButtonBuilder()
                    .setCustomId(`todo_clear`)
                    .setLabel('Clear Done')
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(completedTasks.length === 0)
            );

        const components = actionRow.components.length > 0 ? [actionRow, navRow] : [navRow];

        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({ embeds: [embed], components });
        } else {
            await interaction.reply({ embeds: [embed], components });
        }
    },

    async clearCompleted(interaction) {
        const todo = await Todo.findOne({ userId: interaction.user.id, guildId: interaction.guildId });

        if (!todo) {
            return interaction.reply({ content: 'You don\'t have any tasks!', ephemeral: true });
        }

        const completedCount = todo.tasks.filter(t => t.completed).length;
        
        if (completedCount === 0) {
            return interaction.reply({ content: 'No completed tasks to clear!', ephemeral: true });
        }

        todo.tasks = todo.tasks.filter(t => !t.completed);
        await todo.save();

        const embed = new EmbedBuilder()
            .setColor('#51cf66')
            .setTitle('🗑️ Tasks Cleared')
            .setDescription(`Removed ${completedCount} completed task${completedCount !== 1 ? 's' : ''}.`);

        await interaction.reply({ embeds: [embed] });
    }
};