const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    delete require.cache[require.resolve(filePath)];
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
        const commandData = command.data.toJSON();
        
        if (!commandData.integration_types) {
            commandData.integration_types = [0, 1];
        }
        if (!commandData.contexts) {
            commandData.contexts = [0, 1, 2];
        }
        
        commands.push(commandData);
        console.log(`✅ Loaded: /${command.data.name} (Contexts: ${commandData.contexts.join(', ')})`);
    } else {
        console.log(`⚠️ Warning: ${file} is missing "data" or "execute"`);
    }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`\n🔄 Deploying ${commands.length} commands with User Install support...\n`);

        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log(`✅ Successfully deployed ${data.length} commands!\n`);
        
        console.log('📋 Commands deployed:');
        data.forEach(cmd => {
            const contexts = cmd.contexts || [0];
            const contextNames = {
                0: 'Servers',
                1: 'Bot DMs', 
                2: 'Group DMs'
            };
            const contextList = contexts.map(c => contextNames[c]).join(', ');
            console.log(`   /${cmd.name} - Available in: ${contextList}`);
        });
        
        console.log('\n✨ Commands are now available globally!');
        console.log('💡 Users can now install your bot for personal use!\n');
        
    } catch (error) {
        console.error('❌ Error deploying commands:', error);
    }
})();
