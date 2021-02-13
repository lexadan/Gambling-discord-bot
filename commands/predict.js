const log = require('../Tools/logs');
const redis = require('../Tools/redis');
const config = require("../config.json");
const replies = require('../replies');
const Discord = require("discord.js");
const {progressBar} = require("../Tools/progressBar");


async function saveBet(redis, message, predict) {
	await redis.set('predictAuthor', predict.author);
	await redis.set('predictQuestion', predict.question);
	for (let i = 0; i < predict.propsNbr; i++) {
		await redis.set(`prop${i+1}`, 0);
		await redis.zadd('props', i+1, predict.props[i]);
	}
	msgCtor(message);
}

async function deletePredict(message) {
	log.info(`${message.author.username} is trying to delete current prediction`);
	let author = await redis.get('predictAuthor');
	if (author != message.author.id) {
		log.ko(`Can't delete : Wrong author`);
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
	log.redis('Prediction succesfully deleted');
	return;
}

async function msgCtor(message) {
	let Embed = new Discord.MessageEmbed();
	Embed.setColor("#0099ff").setTitle("Prediction !");

	let totalBet = await redis.get('totalBet');
	let question = await redis.get('predictQuestion');
	Embed.setDescription(question);	
	let props = await redis.zrange('props', 0, 5);
	let lenght = await redis.zcount('props', 0, 5);
	for (let i = 0; i < lenght; i++) {
		let bet = await redis.get(`prop${i + 1}`);
		let cote = (bet == 0) ? (0) : (totalBet/bet)
		let progressbar = progressBar(0, 1, 15);
		Embed.addField(`${i + 1}) ${props[i]}`, `${progressbar} ${bet} ${config.bet.name} (1:${cote})`);
	}
	let msg = await message.channel.send(Embed);
	await redis.set('predictMessageID', msg.id);
}

module.exports = {
	name: "predict",
	desc: "instanciate a prediction",
	async run(client, message, args) {
		log.info(`${message.author.username} is trying to place make a prediction`);
		if (args.at[0] == "-delete")
			return deletePredict(message);
		if (args.lenght < 3) {
			log.ko(`Invalid Parameter for prediction`);
			message.reply(replies.PredictInvalidArguments, {
				tts: config.bet.tts,
			});
			return;
		}
		const question = args.at[0];
		const props = args.at.splice(1);
		/* let betMsg = `Question : ${question}\n`;
		for (let i = 0; i < args.lenght - 1; i++)
			betMsg += `\t${i + 1}) ${props[i]}\n`; */
		saveBet(redis, message, {
			author: message.author.id,
			props: props,
			question: question,
			propsNbr: args.lenght - 1
		});
		log.redis(`New prediction with question : ${question} and props : [${props}] by ${message.author.username}`);
	}
}