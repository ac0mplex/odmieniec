const config = require('../config.json');
const random = require('./random.js');

function amIMentioned(msg) {
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

function isUserMentioned(msg, username) {
	let isMentioned = false;

	msg.mentions.users.each(user => {
		if (user.username == username) {
			isMentioned = true;
		}
	});

	return isMentioned;
}

function removeMentions(msg) {
	let newMsg = msg.replace(/\<.*\>/g, "").trim();
	newMsg = newMsg.replace(/  /g, " ");
	return newMsg;
}

function isYesOrNoQuestion(msg) {
	msg = removeMentions(msg).toLowerCase();

	return msg.startsWith("czy");
}

function answerYesOrNo() {
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

function isQuestionAboutPerson(msg) {
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

function choosePerson(guild) {
	let response = "";
	let randomResponse = guild.members.fetch()
		.then(users => {
			let usersArray = users.array();
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


function isDumpRequest(msg) {
	msg = removeMentions(msg).toLowerCase();

	return msg.startsWith("brain dump") ||
		   msg.startsWith("braindump");
}

module.exports.amIMentioned = amIMentioned;
module.exports.isUserMentioned = isUserMentioned;
module.exports.isYesOrNoQuestion = isYesOrNoQuestion;
module.exports.answerYesOrNo = answerYesOrNo;
module.exports.isQuestionAboutPerson = isQuestionAboutPerson;
module.exports.choosePerson = choosePerson;
module.exports.isDumpRequest = isDumpRequest;
