module.exports = {
	redis: function(log, code = 0) {
		console.log('[\x1b[32m%s\x1b[0m]: ' + `${log}`, 'Redis');
		return code;
	},
	info: function(log, code = 0) {
		console.log('[\x1b[36m%s\x1b[0m]: ' + `${log}`, 'Info');
		return code;
	},
	warning: function(log, code = 0) {
		console.log('[\x1b[33m%s\x1b[0m]: ' + `${log}`, 'Warning');
		return code;
	},
	error: function(log, code = 0) {
		console.log('[\x1b[31m%s\x1b[0m]: ' + `${log}`, 'Error');
		return code;
	},
	ok: function(log, code = 0) {
		console.log('[\x1b[32m%s\x1b[0m]: ' + `${log}`, 'OK');
		return code;
	},
	ko: function(log, code = 0) {
		console.log('[\x1b[31m%s\x1b[0m]: ' + `${log}`, 'KO');
		return code;
	}
};