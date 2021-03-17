const log = require('../Tools/logs');
const redis = require('../Tools/redis');
const config = require("../config.json");
const replies = require('../replies');


module.exports = {
	name: "wallet",
	desc: "Show user's wallet",
	async run(client, message, args) {
		let exist = await redis.exists(`test`);
		if (exist) {
			let config_ = await redis.get('test');
			let obj = JSON.parse(config_);
			obj.prefix = 'nul';
			obj.bet.test = 'lul';
			obj.bet.test2 = [];
			obj.bet.test2.push({
				bite: "miam",
				byte: "Pas miam"
			});
			console.log(obj.bet.test2[0].bite);
		}
		else {
			await redis.set('test', JSON.stringify(config));
		}
	}
}