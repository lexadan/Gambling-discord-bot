const log = require('../Tools/logs');
const redis = require('../Tools/redis');
const config = require("../config.json");
const replies = require('../replies');
const Discord = require("discord.js");
const {progressBar} = require("../Tools/progressBar");


async function placeBet(message, bet, propChoice) {
	let balance = await redis.get(message.author.id);

	if (!balance) {
		redis.set(message.author.id, config.bet.default_balance);
		balance = config.bet.default_balance;
		log.info('No balance found, set to default value');

	} else {
		log.info(`Balance found : ${balance}`);
	}
	if (balance < bet) {
		message.reply(replies.BetInsufisantBalance(config.bet.name), {
			tts: config.bet.tts,
		});
		log.ko(`Not enough found for bet: ${balance}<${bet}`);
		return;
	} else {
		redis.decrby(message.author.id, bet);
		redis.incrby('totalBet', bet);
		redis.incrby(`prop${propChoice}`, bet);
		redis.lpush(`prop${propChoice}Candidate`, `${message.author.id},${bet}`);
		log.redis('Bet succesfully placed');
	}
}

async function msgCtor() {
	let Embed = new Discord.MessageEmbed();
	Embed.setColor("#0099ff").setTitle("Prediction !");
	let msg = "Question : ";

	let totalBet = await redis.get('totalBet');
	let question = await redis.get('predictQuestion');
	msg += `${question}\n`;
	Embed.setDescription(question);	
	let props = await redis.zrange('props', 0, 5);
	let lenght = await redis.zcount('props', 0, 5);
	for (let i = 0; i < lenght; i++) {
		let bet = await redis.get(`prop${i + 1}`);
		let cote = (bet == 0) ? (0) : (totalBet/bet)
		let progressbar = progressBar(bet/totalBet, 1, 15);
		Embed.addField(`${i + 1}) ${props[i]}`, `${progressbar} ${bet} ${config.bet.name} (1:${cote})`);
		msg += `\t${i + 1}) ${props[i]}\t ${bet} ${config.bet.name} (1:${cote.toPrecision(2)})\n`;
	}
	return Embed;
}

async function updateMessage(message) {
	let msgId = await redis.get('predictMessageID');
	try {
		message.channel.messages.fetch(msgId).then(msg => {
			msgCtor().then(res => {
				msg.edit(res);
			});
		});
		log.ok(`Prediction message updated`);
	} catch(err) {
		log.ko(err);
	}
}

async function checkAlreadyBet(message) {
	let res = true;
	let propNbr = await redis.zcount('props', 0, 5);
	for (let i = 0; i < propNbr; i++) {
		let candidate = await redis.lrange(`prop${i + 1}Candidate`, 0, 100);
		candidate.forEach(element => {
			let candidateSplit = element.split(",");
			if (candidateSplit[0] == message.author.id) {
				log.ko(`${message.author.username} have already bet`);
				message.reply(replies.BetAlreadyVoted, {
					tts: config.bet.tts,
				});
				res = false;
			}
		});
	}
	return res;
}

module.exports = {
	name: "bet",
	desc: "Flemme",
	async run(client, message, args) {
		log.info(`${message.author.username} is trying to place a bet`);
		if (args.lenght != 2) {
			log.ko('Invalid parameters for bet');
			message.reply(replies.BetInvalideArguments, {
				tts: config.bet.tts,
			});
			return;
		}
		let propChoice = +args.at[0];
		let bet = +args.at[1];
		let propNbr = await redis.zcount('props', 0, 9);
		if (propChoice > propNbr)  {
			log.ko('Invalid Parameter for bet: propChoice');
			return;
		}
		if (isNaN(bet) || bet < 0) {
			log.ko('Invalid Parameter for bet: Bet');
			return;
		}
		checkAlreadyBet(message).then(bool => {
			if (bool) {
				placeBet(message, bet, propChoice);
				updateMessage(message);
			}
		});
	}
}