const log = require('../Tools/logs');
const redis = require('../Tools/redis');
const config = require("../config.json");
const replies = require('../replies');


async function saveBet(redis, predict) {
	redis.set('predictMessageID', predict.msgId);
	redis.set('predictAuthor', predict.author);
	redis.set('predictQuestion', predict.question);
	for (let i = 0; i < predict.propsNbr; i++) {
		redis.set(`prop${i+1}`, 0);
		redis.zadd('props', i+1, predict.props[i]);
	}
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
		let betMsg = `Question : ${question}\n`;
		for (let i = 0; i < args.lenght - 1; i++)
			betMsg += `\t${i + 1}) ${props[i]}\n`;
		let msg = await message.channel.send(betMsg);
		saveBet(redis, {
			msgId: msg.id,
			author: message.author.id,
			props: props,
			question: question,
			propsNbr: args.lenght - 1
		});
		log.redis(`New prediction with question : ${question} and props : [${props}] by ${message.author.username}`);
	}
}