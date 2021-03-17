const log = require('../Tools/logs');
const redis = require('../Tools/redis');
const config = require("../config.json");
const replies = require('../replies');
const Discord = require("discord.js");
const uniqid = require('uniqid');
const {progressBar} = require("../Tools/progressBar");

function addOptionsReactions(msg, opt_nbr) {
	for (let i = 0; i < opt_nbr; i++) {
		switch(i) {
			case 0:
				msg.react('1️⃣');
				break;
			case 1:
				msg.react('2️⃣');
				break;
			case 2:
				msg.react('3️⃣');
				break;
			case 3:
				msg.react('4️⃣');
				break;
			case 4:
				msg.react('5️⃣');
				break;
			default:
				break;
		}
	}
}

module.exports = {
	addNewPrediction(data, message) {
		let bet_id = uniqid();
		let bet_json = {
			totalBet: data.totalBet,
			author_id: data.author_id,
			channel_id: data.channel_id,
			question: data.question,
			options_lenght: data.options_lenght,
			options: []
		};
		for (let i = 0; i < data.options_lenght; i++) {
			bet_json.options.push({
				content: data.props[i],
				totalBet: 0,
				bettor: []
			})
		}
		message.channel.send(this.predictionEmbedCtor(bet_json))
			.then( msg => {
				addOptionsReactions(msg, bet_json.options_lenght);
				bet_json.msg_id = msg.id;
				redis.set(`bet:${bet_id}`, JSON.stringify(bet_json)).then(
					log.redis(`New prediction: "${bet_id}" by ${message.author.username}`)
				);
			});
		
	},
	predictionEmbedCtor(bet) {
		let Embed = new Discord.MessageEmbed()
		.setColor(config.bet.embed_color)
		.setTitle("Prediction !")
		.setDescription(bet.question);

		for (let i = 0; i < bet.options_lenght; i++) {
			let opt = bet.options[i];
			let ratio = (opt.totalBet == 0) ? 0 : (bet.totalBet / opt.totalBet);
			let progressbar = progressBar(ratio, 1, 15);
			Embed.addField(`${i + 1}) ${opt.content}`, `${progressbar} ${opt.totalBet} ${config.bet.name} (1:${ratio})`);
		}
		return Embed;
	}
}
