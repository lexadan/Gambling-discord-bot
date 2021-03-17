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

function getChoiceByReact(emoji) {
	switch(emoji) {
		case '1️⃣':
			return 0;
		case '2️⃣':
			return 1;
		case '3️⃣':
			return 2;
		case '4️⃣':
			return 3;
		case '5️⃣':
			return 4;
		default:
			throw("Wrong emoji")
	}
}

function displayBettable() {
	let res = '';
	for (let i = 0; i < config.bet.bettable_lenght; i++) {
		res += `${config.bet.bettable[i].emoji} = ${config.bet.bettable[i].value} ${config.bet.name}\t`
	}
	return res;
}

function addBettor(bet, bet_id, emoji, user) {
	let choice = getChoiceByReact(emoji);
	let pound_msg = displayBettable();
	user.send(`${bet.options[choice].content}\n${replies.betHowMany(user.username, config.bet.name)}\n${pound_msg}`).then(msg => {
		redis.hmset(`msg:${msg.id}`, {
			bet_id: bet_id,
			opt_idx: choice
		});
		bet.options_msg.push(msg.id);
		bet.bettors.push(user.id);
		redis.set(`bet:${bet_id}`, JSON.stringify(bet)).then(
			log.ok(`New bettor added to bet "${bet_id}"`)
		);
	});
}



module.exports = {
	addNewPrediction(data, message) {
		let bet_id = uniqid();
		let bet_json = {
			totalBet: data.totalBet,
			author_id: data.author_id,
			channel_id: data.channel_id,
			question: data.question,
			bettors: [],
			options_lenght: data.options_lenght,
			options: []
		};
		for (let i = 0; i < data.options_lenght; i++) {
			bet_json.options.push({
				content: data.props[i],
				totalBet: 0,
				bettors: []
			})
		}
		message.channel.send(this.predictionEmbedCtor(bet_json))
			.then( msg => {
				addOptionsReactions(msg, bet_json.options_lenght);
				bet_json.msg_id = msg.id;
				bet_json.options_msg = [];
				try {
					redis.set(`bet:${bet_id}`, JSON.stringify(bet_json)).then(
						log.redis(`New prediction: "${bet_json.question}" by ${message.author.username}`)
					);
					redis.set(`msg:${msg.id}`, bet_id);
				} catch (e) { return log.ko(e) }

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
	},
	async checkBetMessageReaction(reaction, user) {
		try {
			let bet_id = await redis.get(`msg:${reaction.message.id}`);
			if (bet_id) {
				let bet = await redis.get(`bet:${bet_id}`);
				addBettor(JSON.parse(bet), bet_id, reaction.emoji.name, user)
			} else
				reaction.users.remove(user.id);
		} catch(e) { return log.ko(e)}
	}
}
