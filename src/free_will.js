import config from '../config.json' with { type: 'json' };
import * as random from './random.js';

let requestsUntilWantToTalk = config.minRequestsToRandomTalk

export function wantToTalk() {
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


export function dump() {
	return `Requests until want to talk: ${requestsUntilWantToTalk}`;
}
