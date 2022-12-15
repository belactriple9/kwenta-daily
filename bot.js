
const { Client, Events, GatewayIntentBits, REST, Routes, Collection } = require('discord.js');
const auth = require('./auth.json'); // contains token and client_id
const fetch = require('node-fetch');
const fs = require('fs');
const commands = require('./botCommands/Kwentapedia.js'); // an array of slash commands

// our intent is to listen for slash commands

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

commands.map(command => {
    client.commands.set(command.data.name, command);
});

client.once(Events.ClientReady, async () => {
    console.log('Registering application commands!');
    //auth contains token and client_id
    const rest = new REST({ version: '10' }).setToken(auth.token);
    const commandArr = client.commands.map(command => command.data.toJSON());
    await rest.put(
        Routes.applicationCommands(auth.client_id),
        { body: commandArr }
    );
    console.log("Successfully registered application commands.");
})

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    // console.log(interaction);
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
        await command.execute(interaction);
    }
    catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

client.login(auth.token);




/*
link to invite bot to server:
`https://discord.com/oauth2/authorize?&client_id=${client_id}&scope=bot&permissions=2147485696 `
*/