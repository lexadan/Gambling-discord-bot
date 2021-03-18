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

function addReaction(msg) {
	for (let i = 0; i < config.bet.bettable_lenght; i++) {
		msg.react(config.bet.bettable[i].emoji);
	}
}

function addBettor(bet, bet_id, emoji, user) {
	for (let  i = 0; i < bet.bettors_nbr; i++) {
		if (bet.bettors[i] == user.id)
			return;
	}
	bet.bettors_nbr++;
	let choice = getChoiceByReact(emoji);
	let pound_msg = displayBettable();
	user.send(`${bet.options[choice].content}\n${replies.betHowMany(user.username, config.bet.name)}\n${pound_msg}`).then(msg => {
		addReaction(msg);
		redis.hmset(`msg:money:${msg.id}`, {
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

function addTotalBet(profile, reaction, user, bet_data, client) {
	let balance;
	for (let i = 0; i < config.bet.bettable_lenght; i++)
		if (config.bet.bettable[i].emoji == reaction.emoji.name)
			balance = config.bet.bettable[i].value;
	if (balance == undefined)
		return log.ko(`Wrong emoji used`, 84);
	if (balance > profile.wallet) {
		reaction.message.channel.send(replies.BetInsufisantBalance(config.bet.name), {
			tts: config.bet.tss
		});
		return log.ko(`Insufisant wallet fund for bet ${profile.wallet} < ${balance}`);
	}
	bet_data.bet.totalBet += balance;
	bet_data.bet.options[bet_data.choice].totalBet += balance;
	let alreadybet = false;
	for (let i = 0; i < bet_data.bet.options[bet_data.choice].bettors_nbr; i++) {
		if (bet_data.bet.options[bet_data.choice].bettors[i].id == user.id) {
			alreadybet = true;
			bet_data.bet.options[bet_data.choice].bettors[i].bet += balance;
		}
	}
	if (!alreadybet) {
		bet_data.bet.options[bet_data.choice].bettors.push({
			id: user.id,
			username: user.username,
			bet: balance
		});
		bet_data.bet.options[bet_data.choice].bettors_nbr++;
	}
	redis.hset(`profile:${user.id}`, 'wallet', profile.wallet - balance);
	redis.set(`bet:${bet_data.bet_id}`, JSON.stringify(bet_data.bet)).then(() => {
		log.redis(`Bet succesfully added for ${user.username}`);
		client.channels.fetch(bet_data.bet.channel_id).then(channel => {
			channel.messages.fetch(bet_data.bet.msg_id).then(msg => {
				msg.edit(module.exports.predictionEmbedCtor(bet_data.bet));
			});
		});
	});
}

function declareWinners(reaction, bet, client, bet_id) {
	let winning_choice = getChoiceByReact(reaction.emoji.name);
	let Embed = new Discord.MessageEmbed()
		.setColor(config.bet.embed_color)
		.setTitle("Prediction Winners !")
		.setDescription(bet.options[winning_choice].content)
	client.channels.fetch(bet.channel_id).then(channel => {
		let winners = bet.options[winning_choice].bettors;
		let totalBet = bet.totalBet;
		let optBet = bet.options[winning_choice].totalBet;
		let cote = Math.round(totalBet / optBet);
		winners.forEach(winner => {
			redis.hincrby(`profile:${winner.id}`, 'wallet',  winner.bet * cote);
			Embed.addField(winner.username, `${winner.bet * cote} ${config.bet.name}`);
		});
		channel.send(Embed);
		module.exports.deletePrediction(bet, bet_id);
	});
}

module.exports = {
	deletePrediction(bet, bet_id) {
		redis.del(`msg:win:${bet.msg_win_id}`);
		redis.del(`msg:${bet.msg_id}`);
		let options_msg = bet.options_msg;
		if (options_msg)
			options_msg.forEach(element => {
			redis.del(`msg:money:${element}`);
		});
		redis.del(`bet:${bet_id}`);
	},
	async addNewPrediction(data, message) {
		let bet_id = uniqid();
		let bet_json = {
			totalBet: data.totalBet,
			author_id: data.author_id,
			channel_id: data.channel_id,
			question: data.question,
			bettors_nbr: 0,
			bettors: [],
			options_lenght: data.options_lenght,
			options: []
		};
		for (let i = 0; i < data.options_lenght; i++) {
			bet_json.options.push({
				content: data.props[i],
				totalBet: 0,
				bettors_nbr: 0,
				bettors: []
			})
		}
		try {
			let msg = await message.channel.send(this.predictionEmbedCtor(bet_json));
			addOptionsReactions(msg, bet_json.options_lenght);
			bet_json.msg_id = msg.id;
			bet_json.options_msg = [];
			redis.set(`msg:${msg.id}`, bet_id);
			let win_msg = await message.author.send(`Choose winner !`);
			addOptionsReactions(win_msg, bet_json.options_lenght);
			bet_json.msg_win_id = win_msg.id;
			redis.set(`msg:win:${win_msg.id}`, bet_id);
			redis.set(`bet:${bet_id}`, JSON.stringify(bet_json)).then(
				log.redis(`New prediction: "${bet_json.question}" by ${message.author.username}`)
			);
		} catch (e) { return log.ko(e) }
	},
	predictionEmbedCtor(bet) {
		let Embed = new Discord.MessageEmbed()
		.setColor(config.bet.embed_color)
		.setTitle("Prediction !")
		.setDescription(bet.question);

		for (let i = 0; i < bet.options_lenght; i++) {
			let opt = bet.options[i];
			let ratio = (opt.totalBet == 0) ? 0 : (bet.totalBet / opt.totalBet);
			let progressbar = progressBar(opt.totalBet / bet.totalBet, 1, 15);
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
				if (reaction.message.channel.type != 'dm')
					reaction.users.remove(user.id);
		} catch(e) { return log.ko(e)}
	},
	async checkMoneyMessageReaction(reaction, user, profile, client) {
		try {
			let bet_data = await redis.hgetall(`msg:money:${reaction.message.id}`);
			if (bet_data) {
				let bet = await redis.get(`bet:${bet_data.bet_id}`);
				if (!bet)
					throw ("Unknown Bet");
				addTotalBet(profile, reaction, user, {
					bet: JSON.parse(bet),
					bet_id: bet_data.bet_id,
					choice: bet_data.opt_idx
				}, client);
			}
		} catch(e) {log.ko(e)}
	},
	async checkWinMessageReaction(reaction, user, client) {
		try {
			let bet_id = await redis.get(`msg:win:${reaction.message.id}`);
			if (bet_id) {
				let bet = await redis.get(`bet:${bet_id}`);
				if (!bet)
					throw ("Unknown Bet");
				declareWinners(reaction, JSON.parse(bet), client, bet_id);
			}
		} catch(e) {log.ko(e)}
	}
}
