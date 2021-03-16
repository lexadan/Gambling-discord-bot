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
	msgCtor(id, message);
}


async function msgCtor(id, message) {
	let Embed = new Discord.MessageEmbed();
	Embed.setColor("#0099ff").setTitle("Prediction !");

	let bet = await redis.hgetall(`bet:${id}`);
	Embed.setDescription(bet.question);	
	for (let i = 0; i < bet.props_nbr; i++) {
		let prop_id = await redis.hget(`bet:${id}`, `prop:${i}`);
		let prop = await redis.hgetall(`props:${prop_id}`);
		let cote = (prop.balance == 0) ? (0) : (bet.balance/prop.balance)
		let progressbar = progressBar(0, 1, 15);
		Embed.addField(`${i + 1}) ${bet.text}`, `${progressbar} ${prop.balance} ${config.bet.name} (1:${cote})`);
	}
	let msg = await message.channel.send(Embed);
	await redis.set(`bet_msg:${msg.id}`, id);
	await redis.hset(`bet:${id}`, 'msg_id', msg.id);
	for (let i = 0; i < bet.props_nbr; i++) {
		switch(i) {
			case 0:
				await msg.react('1️⃣');
				break;
			case 1:
				await msg.react('2️⃣');
				break;
			case 2:
				await msg.react('3️⃣');
				break;
			case 3:
				await msg.react('4️⃣');
				break;
			case 4:
				await msg.react('5️⃣');
				break;
			default:
				break;
		}
	}
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
			author_id: message.author.id,
			balance: 0
		}, props);
		log.redis(`New prediction with question : ${question} and props : [${props}] by ${message.author.username}`);
	}
}