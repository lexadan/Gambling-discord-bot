const log = require('../Tools/logs');
const redis = require('../Tools/redis');
const config = require("../config.json");
const replies = require('../replies');
const Discord = require("discord.js");
const {progressBar} = require("../Tools/progressBar");
const uniqid = require('uniqid');

async function deleteBet(id) {
	let props_nbr = await redis.hget(`bet:${id}`, 'props_nbr');
	for (let i = 0; i < props_nbr; i++) {
		let prop_id = await redis.hget(`bet:${id}`, `prop:${i}`);
		await redis.del(`props:${prop_id}`);
	}
	let msg_id = await redis.hget(`bet:${id}`, `msg_id`);
	await redis.del(`bet_msg:${msg_id}`);
	await redis.del(`bet:${id}`);
}
async function saveBet(message, predict, props) {
	let id = uniqid();
	await redis.hmset(`bet:${id}`, predict);
	for (let i = 0; i < predict.props_nbr; i++) {
		let prop_id = uniqid();
		await redis.hset(`bet:${id}`, `prop:${i}`, prop_id);
		await redis.hset(`props:${prop_id}`, 'text', props[i]);
		await redis.hset(`props:${prop_id}`, 'balance', 0);
	}
	let msg = await message.channel.send('test ma couille');
	await redis.set(`bet_msg:${msg.id}`, id);
	await redis.hset(`bet:${id}`, 'msg_id', msg.id);
	//msgCtor(message);
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
		//temporaire
		if (args.at[0] == "delete")
			deleteBet(args.at[1]);
		log.info(`${message.author.username} is trying to place make a prediction`);
		if (args.lenght < 3) {
			log.ko(`Invalid Parameter for prediction`);
			message.reply(replies.PredictInvalidArguments, {
				tts: config.bet.tts,
			});
			return;
		}
		const question = args.at[0];
		const props = args.at.splice(1);
		saveBet(message, {
			question: question,
			props_nbr: args.lenght - 1,
			author_id: message.author.id
		}, props);
		log.redis(`New prediction with question : ${question} and props : [${props}] by ${message.author.username}`);
	}
}