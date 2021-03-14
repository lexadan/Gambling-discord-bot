const log = require('../Tools/logs');
const redis = require('../Tools/redis');
const config = require("../config.json");
const replies = require('../replies');
const Discord = require("discord.js");

module.exports = {
	name: 'set',
	desc: 'Modify author\'s profile',
	async run(client, message, args) {
		if (args.lenght != 2) {
			log.ko('Invalid args number for profile setting');
			message.reply(replies.settingInvalidParameterNumber, {
				tts: config.bet.tts,
			});
			return;
		}
		if (!['avatar', 'name'].includes(args.at[0])) {
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
		let field = args.at[0];
		let value = args.at[1];
		switch (field) {
			case 'avatar':
				await redis.hset(`profile:${message.author.id}`, 'avatar', value);
				break;
			case 'name':
				await redis.hset(`profile:${message.author.id}`, 'name', value);
				break;
			default:
				break;
		}
		return;
	}
}