require('dotenv').config();

const fs = require('fs');
const { Client, Collection, Intents } = require('discord.js');
const schedule = require('node-schedule');

const Logger = require('./utils/logger');
const Config = require('./config');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

client.commands = new Collection();
client.log = (message, level) => Logger(message, level);
client.error = (message) => Logger(message, 3);
client.config = Config;
client.db = require('./utils/mongo')({
    url: process.env.MONGO_URL,
    db: process.env.MONGO_DB
});

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}

const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const event = require(`./events/${file}`);
	client.log(`[Discord]: Listening for event ${event.name}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute([client, ...args]));
	} else {
		client.on(event.name, (...args) => event.execute([client, ...args]));
	}
}

const scheduleFiles = fs.readdirSync('./schedules').filter(file => file.endsWith('.js'));

for (const file of scheduleFiles) {
	require(`./schedules/${file}`)(schedule, client);
}

client.login(process.env.DISCORD_TOKEN);