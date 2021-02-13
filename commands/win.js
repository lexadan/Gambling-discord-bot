const log = require('../Tools/logs');
const redis = require('../Tools/redis');
const config = require("../config.json");
const replies = require('../replies');


async function deletePredict(message) {
	let author = await redis.get('predictAuthor');
	if (author != message.author.id) {
		message.reply(replies.PredictDeleteWrongAuthor, {
			tts: config.bet.tts,
		});
		return;
	}
	redis.del('predictMessageID');
	redis.del('predictAuthor');
	redis.del('predictQuestion');
	redis.del('totalBet');
	redis.del('props');
	for (let i = 0; i < 9; i++) {
		redis.del(`prop${i + 1}`);
		redis.del(`prop${i + 1}Candidate`);
	}
	log.ok('Prediction succesfully deleted');
	return;
}

async function declareWinner(client, winner, message) {
	let winners = new Array();
	let winnersStr = await redis.lrange(`prop${winner}Candidate`, 0, 100);
	winnersStr.forEach(element => {
		let winnersSplit = element.split(",");
		winners.push({
			id: winnersSplit[0],
			bet: winnersSplit[1]
		});
	});
	log.info(`Winners are : ${winners}`);
	let totalBet = await redis.get('totalBet');
	let propBet = await redis.get(`prop${winner}`);
	let cote = totalBet / propBet;
	let channel = await message.channel;
	winners.forEach(async element => {
		let gain = element.bet * cote;
		await redis.incrby(element.id, gain);
		let user = await channel.members.find(e => e.id == element.id);
		channel.send(replies.Winner(user.user.username, gain, config.bet.name), {
			tts: config.bet.tts,
		});
	});
}
module.exports = {
	name: "win",
	desc: "Decide Prediction's winner",
	async run(client, message, args) {
		log.info(`${message.author.username} try to validate a prediction`);
		if (args.lenght != 1) {
			log.ko(`Invalid arguments for win`);
			message.reply(replies.WinInvalidArguments, {
				tts: config.bet.tts,
			});
			return;
		}
		const winner = +args.at[0];
		let propNbr = await redis.zcount('props', 0, 9);
		if (winner > propNbr) {
			log.ko('Invalid Parameter for bet');
			return;
		}
		let totalBet = await redis.get(`prop${winner}`);
		let props = await redis.zrange('props', 0, 5);
		log.info(`Prop number : ${winner} win the prediction with a totalBet of ${totalBet}`);
		message.reply(replies.WinningChoice(props[winner - 1], totalBet, config.bet.name), {
			tts: config.bet.tts,
		});
		await declareWinner(client, winner, message);
		deletePredict(message);
	}
}