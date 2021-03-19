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
		{ name: `${replies.balanceLabel}`, value: `${profile.wallet} ${config.bet.name}`, inline: false}
	)
	return Embed;
}

module.exports = {
	name: 'profile',
	desc: 'Display author\'s profile',
	async run(client, message, args) {
		log.info(`${message.author.username} try to get his profile`);
		let profile = await redis.hgetall(`profile:${message.author.id}`);
		if (profile) {
			message.channel.send(createEmbed(profile));
		} else {
			try {
				new_profile = {
					guild_id: message.guild.id,
					name: message.author.username,
					avatar: message.author.displayAvatarURL(),
					desc: config.profile.default_desc,
					wallet: config.bet.default_balance
				};
				redis.hmset(`profile:${message.author.id}`, new_profile).then(() =>{
					message.channel.send(createEmbed(new_profile));
					log.ok(`New profile created for ${message.author.username}`);
				});
				
			} catch(e) { return log.redis(e, 84) }
			
		}
	}
}