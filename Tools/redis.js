const log = require("../Tools/logs");
const config = require('../config.json');
const { promisify } = require('util');

const redis = require("redis");
const { off } = require("process");
var redisClient = redis.createClient({
	host: config.redis.host,
	port: config.redis.port
});

redisClient.on('connect', function() {
	log.ok('Redis connected');
});

redisClient.on('end', function() {
	log.ko("Redis client discnonnected");
});

redisClient.on('error', function(err) {
	log.error(`Redis client error : ${err}`);
});

redisClient.on('reconnecting', function(delay, attempt) {
	log.warning(`Trying to reconnect to redis client, ${attempt}`);
});

GET_ASYNC = promisify(redisClient.get).bind(redisClient);
SET_ASYNC = promisify(redisClient.set).bind(redisClient);
DEL_ASYNC = promisify(redisClient.del).bind(redisClient);
INCRBY_ASYNC = promisify(redisClient.incrby).bind(redisClient);
DECRBY_ASYNC = promisify(redisClient.decrby).bind(redisClient);
ZADD_ASYNC = promisify(redisClient.zadd).bind(redisClient);
ZCOUNT_ASYNC = promisify(redisClient.zcount).bind(redisClient);
ZRANGE_ASYNC = promisify(redisClient.zrange).bind(redisClient);
LPUSH_ASYNC = promisify(redisClient.lpush).bind(redisClient);
LRANGE_ASYNC = promisify(redisClient.lrange).bind(redisClient);

//hashes
HMSET_ASYNC = promisify(redisClient.hmset).bind(redisClient);
HSET_ASYNC = promisify(redisClient.hset).bind(redisClient);
HGETALL_ASYNC = promisify(redisClient.hgetall).bind(redisClient);

//set
SADD_ASYNC = promisify(redisClient.sadd).bind(redisClient);
SMEMBERS_ASYNC = promisify(redisClient.smembers).bind(redisClient);
SCARD_ASYNC = promisify(redisClient.scard).bind(redisClient);
module.exports = {
	async get(key) {
		return await GET_ASYNC(key);
	},
	async set(key, value) {
		return await SET_ASYNC(key, value);
	},
	async zadd(key, weight, value) {
		return await ZADD_ASYNC(key, weight, value);
	},
	async zrange(key, min, max) {
		return await ZRANGE_ASYNC(key, min, max);
	},
	async zcount(key, min, max) {
		return await ZCOUNT_ASYNC(key, min, max);
	},
	async del(key) {
		return await DEL_ASYNC(key);
	},
	async zcount(key, min, max) {
		return await ZCOUNT_ASYNC(key, min, max);
	},
	async incrby(key, offset) {
		return await INCRBY_ASYNC(key, offset);
	},
	async decrby(key, offset) {
		return await DECRBY_ASYNC(key, offset);
	},
	async lpush(key, values) {
		return await LPUSH_ASYNC(key, values);
	},
	async lrange(key, min, max) {
		return await LRANGE_ASYNC(key, min, max);
	},
	async hmset(key, obj) {
		return await HMSET_ASYNC(key, obj);
	},
	async hset(set, key, value) {
		return await HSET_ASYNC(set, key, value);
	},
	async hgetall(key) {
		return await HGETALL_ASYNC(key);
	},
	async smembers(set) {
		return await SMEMBERS_ASYNC(set);
	},
	async sadd(set, value) {
		return await SADD_ASYNC(set, value);
	},
	async scard(set) {
		return await SCARD_ASYNC(set);
	}
}