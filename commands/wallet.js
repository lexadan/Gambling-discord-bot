const log = require('../Tools/logs');
const redis = require('../Tools/redis');
const config = require("../config.json");
const replies = require('../replies');


module.exports = {
	name: "wallet",
	desc: "Show user's wallet",
	async run(client, message, args) {
		log.info(`${message.author.username} try access his wallet`);
		let balance = await redis.get(message.author.id);
		if (!balance) {
			log.warning("Author have no balance, default settings applied");
			message.reply(replies.WalletDefaultSetting(config.bet.default_balance, config.bet.name), {
				tts: config.bet.tts,
			})
			await redis.set(message.author.id, config.bet.default_balance);
			log.redis(`Balance for ${message.author.username} have been updated to ${config.bet.default_balance}`);
		} else {
			log.ok(`${message.author.username} has ${balance} points`);
			message.reply(replies.WalletDisplay(balance, config.bet.name), {
				tts: config.bet.tts,
			});
		}
	}
}