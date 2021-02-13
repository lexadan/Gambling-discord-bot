module.exports = {
	info: function(log) {
		console.log('[\x1b[36m%s\x1b[0m]: ' + `${log}`, 'Info');
	},
	warning: function(log) {
		console.log('[\x1b[33m%s\x1b[0m]: ' + `${log}`, 'Warning');
	},
	error: function(log) {
		console.log('[\x1b[31m%s\x1b[0m]: ' + `${log}`, 'Error');
	},
	ok: function(log) {
		console.log('[\x1b[32m%s\x1b[0m]: ' + `${log}`, 'OK');
	},
	ko: function(log) {
		console.log('[\x1b[31m%s\x1b[0m]: ' + `${log}`, 'KO');
	},
};