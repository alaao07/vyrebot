const Birthday = require('../models/Birthday');

module.exports = {
    startBirthdayChecker(client) {
        setInterval(async () => {
            await this.checkBirthdays(client);
        }, 60000);

        this.checkBirthdays(client);
    },

    async checkBirthdays(client) {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const currentDay = now.getDate();
        const currentHour = now.getHours();

        const birthdays = await Birthday.find({});

        for (const birthday of birthdays) {
            const birthdayDate = new Date(currentYear, birthday.month - 1, birthday.day);
            const oneDayBefore = new Date(birthdayDate);
            oneDayBefore.setDate(oneDayBefore.getDate() - 1);
            
            const oneHourBefore = new Date(birthdayDate);
            oneHourBefore.setHours(oneHourBefore.getHours() - 1);

            const resetNotifications = birthday.notificationsSent.lastNotificationYear !== currentYear;

            if (resetNotifications) {
                birthday.notificationsSent = {
                    oneDayBefore: false,
                    oneHourBefore: false,
                    onBirthday: false,
                    lastNotificationYear: currentYear
                };
            }

            if (birthday.month === currentMonth && birthday.day === currentDay) {
                if (!birthday.notificationsSent.onBirthday) {
                    await this.sendBirthdayMessage(client, birthday);
                    birthday.notificationsSent.onBirthday = true;
                    await birthday.save();
                }
            } else if (oneDayBefore.getMonth() + 1 === currentMonth && oneDayBefore.getDate() === currentDay) {
                if (!birthday.notificationsSent.oneDayBefore) {
                    await this.sendOneDayReminder(client, birthday);
                    birthday.notificationsSent.oneDayBefore = true;
                    await birthday.save();
                }
            } else if (birthday.month === currentMonth && birthday.day === currentDay + 1 && currentHour === 23) {
                if (!birthday.notificationsSent.oneHourBefore) {
                    await this.sendOneHourReminder(client, birthday);
                    birthday.notificationsSent.oneHourBefore = true;
                    await birthday.save();
                }
            }
        }
    },

    async sendBirthdayMessage(client, birthday) {
        try {
            const user = await client.users.fetch(birthday.userId);
            const guild = client.guilds.cache.get(birthday.guildId);
            
            if (!guild) return;

            const dm = await user.createDM();
            await dm.send({
                content: `🎉🎂 **HAPPY BIRTHDAY ${user.username.toUpperCase()}!** 🎂🎉\n\nWishing you an amazing day filled with joy and happiness! 🎈✨`
            });

            const systemChannel = guild.systemChannel || guild.channels.cache.find(c => c.type === 0);
            if (systemChannel) {
                await systemChannel.send({
                    content: `🎉 Everyone wish <@${user.id}> a **HAPPY BIRTHDAY!** 🎂🎈`
                });
            }
        } catch (error) {
            console.error('Error sending birthday message:', error);
        }
    },

    async sendOneDayReminder(client, birthday) {
        try {
            const guild = client.guilds.cache.get(birthday.guildId);
            if (!guild) return;

            const members = await guild.members.fetch();
            
            for (const [memberId, member] of members) {
                if (memberId === birthday.userId) continue;

                try {
                    const dm = await member.createDM();
                    await dm.send({
                        content: `🎂 Reminder: **${birthday.username}**'s birthday is **tomorrow**! Don't forget to wish them! 🎉`
                    });
                } catch (error) {
                    console.error(`Could not send DM to ${member.user.username}`);
                }
            }
        } catch (error) {
            console.error('Error sending one day reminder:', error);
        }
    },

    async sendOneHourReminder(client, birthday) {
        try {
            const guild = client.guilds.cache.get(birthday.guildId);
            if (!guild) return;

            const members = await guild.members.fetch();
            
            for (const [memberId, member] of members) {
                if (memberId === birthday.userId) continue;

                try {
                    const dm = await member.createDM();
                    await dm.send({
                        content: `⏰ Last reminder: **${birthday.username}**'s birthday is in **1 hour**! 🎂🎉`
                    });
                } catch (error) {
                    console.error(`Could not send DM to ${member.user.username}`);
                }
            }
        } catch (error) {
            console.error('Error sending one hour reminder:', error);
        }
    }
};