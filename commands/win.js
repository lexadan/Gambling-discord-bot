const log = require('../Tools/logs');
const redis = require('../Tools/redis');
const config = require("../config.json");

async function deletePredict(message) {
	let author = await redis.get('predictAuthor');
	if (author != message.author.id) {
		message.reply('Touche à ton cul', {
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
	let totalBet = await redis.get('totalBet');
	let propBet = await redis.get(`prop${winner}`);
	let cote = totalBet / propBet;
	let channel = await message.channel;
	winners.forEach(async element => {
		let gain = element.bet * cote;
		await redis.incrby(element.id, gain);
		let user = await channel.members.find(e => e.id == element.id);
		channel.send(`${user.user.username} à gagné ${gain} grace à sa vision de jeu`);
	});
	console.log(winners);
}
module.exports = {
	name: "win",
	desc: "Decide Prediction's winner",
	async run(client, message, args) {
		log.info(`${message.author.username} try to validate a prediction`);
		if (args.lenght != 1) {
			log.error(`Invalid arguments for win`);
			message.reply(`⚙️ Les paramètres sont invalides !\n //win <Vainqueur>⚙️`, {
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
		message.reply(`And the winner is ${props[winner - 1]} with a total of ${totalBet} ${config.bet.name}`);
		await declareWinner(client, winner, message);
		deletePredict(message);
	}
}