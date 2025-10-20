const Todo = require('../models/Todo');
const todoCommand = require('../commands/todo');

module.exports = {
    async handleButton(interaction) {
        const parts = interaction.customId.split('_');
        const action = parts[1];

        if (action === 'toggle') {
            await this.toggleTask(interaction, parts[2]);
        } else if (action === 'page') {
            await this.changePage(interaction, parseInt(parts[2]));
        } else if (action === 'refresh') {
            await this.refresh(interaction);
        } else if (action === 'clear') {
            await this.clearCompleted(interaction);
        }
    },

    async toggleTask(interaction, taskId) {
        const todo = await Todo.findOne({ userId: interaction.user.id, guildId: interaction.guildId });

        if (!todo) {
            return interaction.reply({ content: 'Task not found!', ephemeral: true });
        }

        const task = todo.tasks.find(t => t.id === taskId);

        if (!task) {
            return interaction.reply({ content: 'Task not found!', ephemeral: true });
        }

        task.completed = !task.completed;
        await todo.save();

        await todoCommand.displayTodoList(interaction, todo, 0);
        await interaction.deferUpdate();
    },

    async changePage(interaction, page) {
        const todo = await Todo.findOne({ userId: interaction.user.id, guildId: interaction.guildId });

        if (!todo) {
            return interaction.reply({ content: 'No tasks found!', ephemeral: true });
        }

        await todoCommand.displayTodoList(interaction, todo, page);
        await interaction.deferUpdate();
    },

    async refresh(interaction) {
        const todo = await Todo.findOne({ userId: interaction.user.id, guildId: interaction.guildId });

        if (!todo) {
            return interaction.reply({ content: 'No tasks found!', ephemeral: true });
        }

        await todoCommand.displayTodoList(interaction, todo, 0);
        await interaction.deferUpdate();
    },

    async clearCompleted(interaction) {
        const todo = await Todo.findOne({ userId: interaction.user.id, guildId: interaction.guildId });

        if (!todo) {
            return interaction.reply({ content: 'No tasks found!', ephemeral: true });
        }

        const completedCount = todo.tasks.filter(t => t.completed).length;
        todo.tasks = todo.tasks.filter(t => !t.completed);
        await todo.save();

        await todoCommand.displayTodoList(interaction, todo, 0);
        
        await interaction.reply({ content: `Cleared ${completedCount} completed tasks!`, ephemeral: true });
    }
};