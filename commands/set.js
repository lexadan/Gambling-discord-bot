const log = require('../Tools/logs');
const redis = require('../Tools/redis');
const config = require("../config.json");
const replies = require('../replies');
const Discord = require("discord.js");

function createEmbed(profile) {
	let Embed = new Discord.MessageEmbed()
	.setColor(config.profile.color)
	.setTitle(profile.name)
	.setDescription(profile.desc)
	.setThumbnail(profile.avatar)
	.addFields(
		{ name: `${replies.balanceLabel}`, value: `${profile.currency} ${config.bet.name}`, inline: false}
	)
	return Embed;
}

module.exports = {
	name: 'set',
	desc: 'Modify author\'s profile',
	async run(client, message, args) {
		//Error Checking
		if (args.lenght != 2) {
			log.ko('Invalid args number for profile setting');
			message.reply(replies.settingInvalidParameterNumber, {
				tts: config.bet.tts,
			});
			return;
		}
		if (!['avatar', 'name', 'desc'].includes(args.at[0])) {
			log.ko(`Invalid args "${args.at[0]}" for profile setting`);
			message.reply(replies.settingInvalidParameter, {
				tts: config.bet.tts,
			});
			return;
		}
		let author_validity = await redis.exists(`profile:${message.author.id}`);
		if (!author_validity) {
			log.ko(`Invalid author "${args.at[0]}" for profile setting`);
			message.reply(replies.settingInvalidAuthor, {
				tts: config.bet.tts,
			});
			return;
		}
		//Core
		let field = args.at[0];
		let value = args.at[1];
		switch (field) {
			case 'avatar':
				await redis.hset(`profile:${message.author.id}`, 'avatar', value);
				break;
			case 'name':
				await redis.hset(`profile:${message.author.id}`, 'name', value);
				break;
			case 'desc':
				await redis.hset(`profile:${message.author.id}`, 'desc', value);
				break;
			default:
				break;
		}
		let profile = await redis.hgetall(`profile:${message.author.id}`);
		await message.channel.send(createEmbed(profile));
		return;
	}
}