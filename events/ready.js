module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        const guildCount = client.guilds.cache.size;
        const memberCount = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);

        console.log(`${client.user.tag} is online`);
        console.log(`${guildCount} server(s), ${memberCount} member(s)`);
        console.log(new Date().toLocaleString());

        const activities = [
            { name: `Vyre Bot | /help`, type: 0 },
            { name: `${guildCount} servers`, type: 0 },
            { name: `${memberCount} members`, type: 0 }
        ];

        let i = 0;
        setInterval(() => {
            const activity = activities[i % activities.length];
            client.user.setActivity(activity.name, { type: activity.type });
            i++;
        }, 15000);
    }
};
