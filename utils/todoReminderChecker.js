const Todo = require('../models/Todo');

module.exports = {
    startTodoReminderChecker(client) {
        setInterval(async () => {
            await this.checkReminders(client);
        }, 60000);

        this.checkReminders(client);
    },

    async checkReminders(client) {
        const now = new Date();
        const todos = await Todo.find({});

        for (const todo of todos) {
            for (const task of todo.tasks) {
                if (task.reminder && !task.reminderSent && !task.completed) {
                    if (task.reminder <= now) {
                        await this.sendReminder(client, todo.userId, task);
                        task.reminderSent = true;
                    }
                }
            }
            await todo.save();
        }
    },

    async sendReminder(client, userId, task) {
        try {
            const user = await client.users.fetch(userId);
            const dm = await user.createDM();

            const priorityEmojis = { low: '🟢', medium: '🟡', high: '🔴' };

            await dm.send({
                content: `⏰ **Todo Reminder!**\n\n${priorityEmojis[task.priority]} **${task.text}**\n\nDon't forget to complete this task!`
            });
        } catch (error) {
            console.error('Error sending todo reminder:', error);
        }
    }
};