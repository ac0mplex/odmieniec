import config from '../config.json' assert { type: 'json' };
import * as random from './random.js';

export function amIMentioned(msg) {
	if (msg.channel.name == config.homeChannel)
		return true;

	let isItMe = false;

	msg.mentions.users.each(user => {
		if (user.username == config.nickname) {
			isItMe = true;
		}
	});

	return isItMe;
}

export function isUserMentioned(msg, username) {
	let isMentioned = false;

	msg.mentions.users.each(user => {
		if (user.username == username) {
			isMentioned = true;
		}
	});

	return isMentioned;
}

export function removeMentions(msg) {
	let newMsg = msg.replace(/\<.*\>/g, "").trim();
	newMsg = newMsg.replace(/  /g, " ");
	return newMsg;
}

export function isYesOrNoQuestion(msg) {
	msg = removeMentions(msg).toLowerCase();

	return msg.startsWith("czy");
}

export function answerYesOrNo() {
	let responses = [
		"tak",
		"no raczej nie inaczej",
		"to się zgadza",
		"myślę, że tak",
		"oczywiście",

		"nie",
		"chyba kpisz",
		"w żadnym wypadku",
		"wątpię",
		"zapomnij",

		"tego nie wiedzą nawet najstarsi górale",
		"kto wie, kto wie...",
		"może tak, a może nie"
	];

	return responses[random.roll(responses.length)]
}

export function isQuestionAboutPerson(msg) {
	msg = removeMentions(msg).toLowerCase();

	return msg.startsWith("kto") ||
		msg.startsWith("kogo") ||
		msg.startsWith("komu") ||
		msg.startsWith("od kogo") ||
		msg.startsWith("o kogo") ||
		msg.startsWith("po kogo") ||
		msg.startsWith("na kogo") ||
		msg.startsWith("bez kogo") ||
		msg.startsWith("z kim") ||
		msg.startsWith("za kim") ||
		msg.startsWith("w kim") ||
		msg.startsWith("na kim") ||
		msg.startsWith("o kim");
}

export function choosePerson(guild) {
	let response = "";
	let randomResponse = guild.members.fetch()
		.then(users => {
			let usersArray = Array.from(users.values());
			let randomUser = usersArray[random.roll(usersArray.length)];
			let responses = [
				"to musi być {user}",
				"na pewno {user}",
				"możliwe, że {user}",
				"stawiałbym na {user}",
				"być może {user}",
				"{user}, to o tobie mowa",
				"{user}"
			];
			let randomResponse = responses[random.roll(responses.length)];
			return randomResponse.replace("{user}", randomUser.displayName);
		});
	return randomResponse;
}


export function isDumpRequest(msg) {
	msg = removeMentions(msg).toLowerCase();

	return msg.startsWith("brain dump") ||
		msg.startsWith("braindump");
}
