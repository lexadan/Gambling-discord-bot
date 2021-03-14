const log = require('../Tools/logs');
const redis = require('../Tools/redis');
const config = require("../config.json");
const replies = require('../replies');
const Discord = require("discord.js");

function createEmbed(profile) {
	let Embed = new Discord.MessageEmbed()
	.setColor('#2791dd')
	.setTitle(profile.name)
	.setThumbnail(profile.pp)
	.addFields(
		{ name: 'Score', value: `${profile.currency} ${config.bet.name}`, inline: false}
	)
	return Embed;
}

module.exports = {
	name: 'profile',
	desc: 'Display author\'s profile',
	async run(client, message, args) {
		log.info(`${message.author.username} try to get his profile`);
		let isProfile = await redis.exists(`profile:${message.author.id}`);
		if (isProfile) {
			let profile = await redis.hgetall(`profile:${message.author.id}`);
			message.reply(createEmbed(profile));
		} else {
			await redis.hmset(`profile:${message.author.id}`, {
				name: message.author.username,
				pp: message.author.displayAvatarURL(),
				currency: 0
			});
			log.info(`New profile created for ${message.author.username}`);
		}
	}
}