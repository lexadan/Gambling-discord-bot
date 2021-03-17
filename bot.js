const {Client} = require("discord.js");
const client = new Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });

const auth = require("./config.json");
const server = require("./config.json");
const log = require("./Tools/logs"); 

const { parse } = require ("discord-command-parser");
const fs = require('fs');
const replies = require('./replies');
const redis = require("./Tools/redis");
const { sendBetMessage } = require("./modules/bet");

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const commandsList = new Map();

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commandsList.set(command.name, command);
}

client.on("ready",() => {
	log.ok(`${client.user.username} is online !`);
	client.user.setActivity(replies.botActivity);
});

client.on("message", message => {
	if (!message.content.startsWith(server.prefix)) return;
	const parsed = parse(message, server.prefix, {allowSpaceBeforeCommand: true});
	if (!parsed.success) {
		log.error("Parse error");
		return;
	}
	const command = commandsList.get(parsed.command);
	try {
		command.run(client, message, {at: parsed.arguments, lenght: parsed.arguments.length});
		message.delete();
	} catch (err) {
		log.error(`Unknown command : ${parsed.command}`);
	}
});

client.on('messageReactionAdd', async (reaction, user) => {
	if (user.id == client.user.id)
		return;
	if (reaction.partial) {
		try {
			await reaction.fetch();
		} catch (error) {
			log.error(`Something went wrong when fetching the message: ${error}`);
			return;
		}
	}
	checkBetMessage(reaction, user);
	checkPropMessage(reaction, user);
});

client.login(auth.token);

async function checkBetMessage(reaction, user) {
	let bet_id = await redis.get(`bet_msg:${reaction.message.id}`);
	if (bet_id) {
		let already_voted = await redis.sismember(`better_for:${bet_id}`, user.id);
		if (already_voted) {
			log.ko(`${user.username} has already submited a vote`);
			reaction.users.remove(user.id);
			return;
		}
		sendBetMessage(reaction, user, bet_id);
	}
	return;
}

async function checkPropMessage(reaction, user) {
	let prop_id = await redis.get(`props_msg:${reaction.message.id}`);
	if (prop_id) {
		
	}
	return;
}