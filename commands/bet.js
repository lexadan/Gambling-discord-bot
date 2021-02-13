const log = require('../Tools/logs');
const redis = require('../Tools/redis');
const config = require("../config.json");

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
		message.reply("Lol retourne chez toi sale gueux t'as pas assez");
		log.ko(`Not enough found for bet: ${balance}<${bet}`);
		return;
	} else {
		redis.decrby(message.author.id, bet);
		redis.incrby('totalBet', bet);
		redis.incrby(`prop${propChoice}`, bet);
		redis.lpush(`prop${propChoice}Candidate`, `${message.author.id},${bet}`);
	}
}

async function msgCtor() {
	let msg = "Question : ";

	let totalBet = await redis.get('totalBet');
	let question = await redis.get('predictQuestion');
	msg += `${question}\n`;
	let props = await redis.zrange('props', 0, 5);
	let lenght = await redis.zcount('props', 0, 5);
	for (let i = 0; i < lenght; i++) {
		let bet = await redis.get(`prop${i + 1}`);
		let cote = (bet == 0) ? (0) : (totalBet/bet)
		msg += `\t${i + 1}) ${props[i]}\t ${bet} ${config.bet.name} (1:${cote})\n`;
	}
	return msg;
}

async function updateMessage(message) {
	let msgId = await redis.get('predictMessageID');
	try {
		message.channel.messages.fetch(msgId).then(msg => {
			msgCtor().then(res => {
				msg.edit(res);
			});
		});
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
				message.reply(`T'as déjà voté sale fou !`, {
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
			message.reply(`⚙️ Les paramètres sont invalides !\n //bet <Numéro choix> <Somme> ⚙️`, {
				tts: config.bet.tts,
			});
			return;
		}
		let propChoice = +args.at[0];
		let bet = +args.at[1];
		let propNbr = await redis.zcount('props', 0, 9);
		if (propChoice > propNbr || isNaN(bet) || bet < 0) {
			log.ko('Invalid Parameter for bet');
			return;
		}
		checkAlreadyBet(message).then(bool => {
			if (bool) {
				placeBet(message, bet, propChoice);
				log.ok('Bet succesfully placed');
				updateMessage(message);
			}
		});
	}
}