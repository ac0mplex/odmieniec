const config = require('../config.json');
const random = require('./random.js');

let requestsUntilWantToTalk = config.minRequestsToRandomTalk

module.exports.wantToTalk = function () {
	if (requestsUntilWantToTalk > 0) {
		requestsUntilWantToTalk--;
		return false;
	}

	if (random.roll(config.chanceToTalk) == 0) {
		requestsUntilWantToTalk = config.minRequestsToRandomTalk;
		return true;
	} else {
		return false;
	}
}


module.exports.dump = function () {
	return `Requests until want to talk: ${requestsUntilWantToTalk}`;
}
