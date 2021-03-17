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

function getEmojieValue(emoji) {
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

async function deleteMessage(msg_id) {
	await redis.del(`props_msg:${msg_id}`);
	console.log(msg_id);
}

async function getBetPound(emoji) {
	for (let i = 0; i < config.bet.bettable_lenght; i++) {
		if (emoji == config.bet.bettable[i].emoji) {
			return +config.bet.bettable[i].value;
		}
	}
	throw("Wrong emoji")
}

module.exports = {
	async sendBetMessage(reaction, user, bet_id) {
		let emoji_value = 0;
		try {
			emoji_value = getEmojieValue(reaction.emoji.name);
		} catch(e) {
			log.warning(e);
			return;
		}
		let prop_id = await redis.hget(`bet:${bet_id}`, `prop:${emoji_value}`);
		let prop = await redis.hgetall(`props:${prop_id}`);
		let pound_msg = displayBettable();
		let msg = await user.send(`${prop.text}\n${replies.betHowMany(user.username, config.bet.name)}\n${pound_msg}`);
		for (let i = 0; i < config.bet.bettable_lenght; i++) {
			msg.react(`${config.bet.bettable[i].emoji}`);
		}
		await redis.set(`props_msg:${msg.id}`, prop_id);
		await redis.sadd(`better_for:${bet_id}`, user.id);
		setTimeout(deleteMessage, 120000, msg.id);
	},
	async addBet(reaction, user, prop_id) {
		let bet_id = await redis.hget(`props:${prop_id}`, 'bet_id');
		try {
			let bet_pound = await getBetPound(reaction.emoji.name);
			await redis.hincrby(`bet:${bet_id}`, 'balance', bet_pound);
			await redis.hincrby(`props:${prop_id}`, 'balance', bet_pound);
			await redis.sadd(`prop_board:${prop_id}`, `${user.id} ${bet_pound}`);
		} catch (e) { return (log.ko(e)) }
		
	}
}