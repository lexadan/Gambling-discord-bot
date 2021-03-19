const log = require('../Tools/logs');
const redis = require('../Tools/redis');
const config = require("../config.json");
const replies = require('../replies');
const Discord = require("discord.js");
const uniqid = require('uniqid');
const {progressBar} = require("../Tools/progressBar");

// Add required reactions to msg based on opt_nbr
/* 
msg: message that receive reactions
opt_nbr: number of option in the prediction [1-5]
*/
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

//Return a value based on a emoji
/*
emoji: emoji received that need to be convert
return: emoji value (equivalent)
*/
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
		case `❌`:
			return -1;
		default:
			throw("Wrong emoji")
	}
}

// Add to msg reaction based on all the bettables found on the configuration file
/*
msg: message that receive reactions
*/
function addReaction(msg) {
	for (let i = 0; i < config.bet.bettable_lenght; i++) {
		msg.react(config.bet.bettable[i].emoji);
	}
}

// Return a discord embed for the win selector message (author only)
/*
bet: Bet datas on wich emebed is constructed
return: Discord Embed
*/
function winEmbedCtor(bet) {
	let Embed = new Discord.MessageEmbed()
		.setColor(config.bet.embed_color)
		.setTitle("Choose the winner")
		.setDescription(bet.question);

		for (let i = 0; i < bet.options_lenght; i++) {
			let opt = bet.options[i];
			Embed.addField(`${i + 1}) ${opt.content}`, '\u200B');
		}
		return Embed;
}

// Return a discord embed for the bet selector message (bettor only)
/*
profile: User's profile
option: Option of the prediction handled by this embed
question: question of the prediction
totalbet: total of bet of the user
return: Discord Embed
*/
function bettableEmbedCtor(profile, option, question, totalbet) {
	let Embed = new Discord.MessageEmbed()
		.setColor(config.bet.embed_color)
		.setTitle(`Bets: ${question}`)
		.setDescription(`You choosed "${option.content}"`)
		.addFields(
			{ name: 'Wallet', value: `${profile.wallet}${config.bet.name}`, inline: true},
			{ name: 'Total Bet', value: `${totalbet}${config.bet.name}`, inline: true},
			{ name: '\u200B', value: '\u200B' }
		);
	let bettables = config.bet.bettable;
	bettables.forEach(element => {
		Embed.addField(`${element.emoji}`, `${element.value}`, true)
	});
	return Embed;
}

// Add a bettor to the prediction (first time only) and send him message for bet selection
/*
bet: all the bet data
bet_id: id of the bet (DB purpose)
emoji: emoji used by the user
user: user's data
profile: user's profile
*/
function addBettor(bet, bet_id, emoji, user, profile) {
	for (let  i = 0; i < bet.bettors_nbr; i++) {
		//Check if user already bet for this prediction and leave if yes
		if (bet.bettors[i] == user.id)
			return log.warning(`${user.username} already bet`);
	}
	bet.bettors_nbr++;
	let choice = getChoiceByReact(emoji);
	user.send(bettableEmbedCtor(profile, bet.options[choice], bet.question, 0)).then(msg => {
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

// Add a bet to prediction and handle wallet management
/*
profile: user's profile
reaction: user's reaction datas
user: user's data
bet_data: {options's choice, bet's data}
client: Bot client
*/
function addTotalBet(profile, reaction, user, bet_data, client) {
	let balance;
	for (let i = 0; i < config.bet.bettable_lenght; i++)
		// Set balance to a value only if reaction's emoji is part of the bettables in configuration file
		if (config.bet.bettable[i].emoji == reaction.emoji.name)
			balance = config.bet.bettable[i].value;
	if (balance == undefined)
		return log.ko(`Wrong emoji used`, 84);
	// Check if user have enought currency to place this bet
	if (balance > profile.wallet) {
		reaction.message.channel.send(replies.BetInsufisantBalance(config.bet.name), {
			tts: config.bet.tss
		});
		return log.ko(`Insufisant wallet fund for bet ${profile.wallet} < ${balance}`);
	}
	// Update both totalbet of the predicion and totalbet of the option
	bet_data.bet.totalBet += balance;
	bet_data.bet.options[bet_data.choice].totalBet += balance;
	let alreadybet = false; // Boolean to check if user alreadybet for this option
	let user_totalbet = 0;
	for (let i = 0; i < bet_data.bet.options[bet_data.choice].bettors_nbr; i++) {
		// If user is found in option bettors list, his datas are updated
		if (bet_data.bet.options[bet_data.choice].bettors[i].id == user.id) {
			log.info(`${user.id} add ${balance} to his totalBet on option: "${bet_data.bet.options[bet_data.choice].content}"`)
			alreadybet = true;
			bet_data.bet.options[bet_data.choice].bettors[i].bet += balance;
			user_totalbet = bet_data.bet.options[bet_data.choice].bettors[i].bet;
		}
	}
	if (!alreadybet) { // False only if user's id wasn't found in option bettors list
		log.info(`New bettor for option: "${bet_data.bet.options[bet_data.choice].content}" with ${balance} currency"`)
		bet_data.bet.options[bet_data.choice].bettors.push({
			id: user.id,
			username: user.username,
			bet: balance
		});
		bet_data.bet.options[bet_data.choice].bettors_nbr++;
		user_totalbet = balance;
	}
	redis.hset(`profile:${user.id}`, 'wallet', profile.wallet - balance);
	//Update only for display
	profile.wallet -= balance;
	redis.set(`bet:${bet_data.bet_id}`, JSON.stringify(bet_data.bet)).then(() => {
		log.redis(`Bet succesfully added for ${user.username}`);
		// Update main message by fetching him by id and editing him with new embed
		client.channels.fetch(bet_data.bet.channel_id).then(channel => {
			channel.messages.fetch(bet_data.bet.msg_id).then(msg => {
				msg.edit(module.exports.predictionEmbedCtor(bet_data.bet));
			});
		});
		// Update bet selection message
		reaction.message.edit(bettableEmbedCtor(profile, bet_data.bet.options[bet_data.choice], bet_data.bet.question, user_totalbet));
	});
}

// Get the winning option and winning bettors, display it, give reward and delete prediction
/*
reaction: user reaction's data
bet: bet's data
client: Bot client
bet_id: bet's id (DB Purpose)
*/
function declareWinners(reaction, bet, client, bet_id) {
	let winning_choice = getChoiceByReact(reaction.emoji.name);
	// QuickFix to know if author decided to delete prediction instead of choosing a winner
	if (winning_choice == -1) {
		module.exports.deletePrediction(bet, bet_id);
		return;
	}
	let Embed = new Discord.MessageEmbed()
		.setColor(config.bet.embed_color)
		.setTitle("Prediction Winners !")
		.setDescription(bet.options[winning_choice].content)
	client.channels.fetch(bet.channel_id).then(channel => {
		let winners = bet.options[winning_choice].bettors;
		let totalBet = bet.totalBet;
		let optBet = bet.options[winning_choice].totalBet;
		let cote = Math.round(totalBet / optBet);
		// Give reward to all the profile and add them to victory embed
		winners.forEach(winner => {
			redis.hincrby(`profile:${winner.id}`, 'wallet',  winner.bet * cote);
			Embed.addField(winner.username, `${winner.bet * cote} ${config.bet.name}`);
		});
		channel.send(Embed);
		module.exports.deletePrediction(bet, bet_id);
	});
}

// Available function in other modules
module.exports = {
	// Delete prediction on the DB
	/*
	bet: bet's data
	bet_id: bet's id (DB Purpose)
	*/
	deletePrediction(bet, bet_id) {
		redis.del(`msg:win:${bet.msg_win_id}`);
		redis.del(`msg:${bet.msg_id}`);
		let options_msg = bet.options_msg;
		if (options_msg)
			options_msg.forEach(element => {
			redis.del(`msg:money:${element}`);
		});
		redis.del(`bet:${bet_id}`);
		log.info(`Bet "${bet.question}" have been sucesfully deleted from the database`);
	},
	// Add a new prediction in the database
	/*
	data: Data send by bet command to create a new bet
	message: discord's message
	*/
	async addNewPrediction(data, message) {
		let bet_id = uniqid(); //Time and hardware based id;
		let bet_json = {
			totalBet: data.totalBet, // All the bets for this prediction
			author_id: data.author_id, // Author of the prediction
			channel_id: data.channel_id, // Channel of the prediction (where the message is posted)
			question: data.question, // Question of the prediction
			bettors_nbr: 0, // Number of bettors for this prediction (regardless of the options)
			bettors: [], // Ids of all the bettors
			options_lenght: data.options_lenght, // Number of options
			options: [] // All the options for this prediction(more below)
		};
		for (let i = 0; i < data.options_lenght; i++) {
			bet_json.options.push({
				content: data.props[i], // Text of this option
				totalBet: 0, // Total of bets for this option
				bettors_nbr: 0, // Number of bettor for this option
				bettors: [] // Data for the bettors of this option
			})
		}
		try {
			let msg = await message.channel.send(this.predictionEmbedCtor(bet_json));
			addOptionsReactions(msg, bet_json.options_lenght);
			bet_json.msg_id = msg.id; // Id of the main message for this prediction
			bet_json.options_msg = []; // Ids of the options message sent to bettors
			redis.set(`msg:${msg.id}`, bet_id);
			let win_msg = await message.author.send(winEmbedCtor(bet_json));
			addOptionsReactions(win_msg, bet_json.options_lenght);
			win_msg.react(`❌`);
			bet_json.msg_win_id = win_msg.id; // Id of the win panel message sent to author
			redis.set(`msg:win:${win_msg.id}`, bet_id);
			redis.set(`bet:${bet_id}`, JSON.stringify(bet_json)).then(
				log.redis(`New prediction: "${bet_json.question}" by ${message.author.username}`)
			);
		} catch (e) { return log.ko(e) }
	},
	// Return an embed for the main message of the prediction
	/*
	bet: bet's data
	return : Discord Embed
	*/
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
	// Check if new reaction is on a main message
	/*
	reaction: reaction's data
	user: user's data
	profile: user's profile
	*/
	async checkBetMessageReaction(reaction, user, profile) {
		try {
			let bet_id = await redis.get(`msg:${reaction.message.id}`);
			if (bet_id) {
				let bet = await redis.get(`bet:${bet_id}`);
				addBettor(JSON.parse(bet), bet_id, reaction.emoji.name, user, profile)
			} else
				if (reaction.message.channel.type != 'dm')
					reaction.users.remove(user.id);
		} catch(e) { return log.ko(e)}
	},
	// Check if new reaction is on a bet selector message
	/*
	reaction: reaction's data
	user: user's data
	profile: user's profile
	client: Bot client
	*/
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
	// Check if new reaction is on a winner selector message
	/*
	reaction: reaction's data
	client: Bot client
	*/
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
