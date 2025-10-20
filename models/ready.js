module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`Logged in as ${client.user.tag}`);
        console.log(`Bot is ready in ${client.guilds.cache.size} servers`);
        client.user.setActivity('Vyre Bot | /help', { type: 'PLAYING' });
    }
};