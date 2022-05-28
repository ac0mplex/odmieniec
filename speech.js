const config = require('./config.json');
const random = require('./random.js');

function amIMentioned(msg) {
	if (msg.channel.name == config.homeChannel)
		return true;

	var isItMe = false;

	msg.mentions.users.each(user => {
		if (user.username == config.nickname) {
			isItMe = true;
		}
	});

	return isItMe;
}

function isUserMentioned(msg, username) {
	var isMentioned = false;

	msg.mentions.users.each(user => {
		if (user.username == username) {
			isMentioned = true;
		}
	});

	return isMentioned;
}

function removeMentions(msg) {
	var newMsg = msg.replace(/\<.*\>/g, "").trim();
	newMsg = newMsg.replace(/  /g, " ");
	return newMsg;
}

function isYesOrNoQuestion(msg) {
	msg = removeMentions(msg).toLowerCase();

	return msg.startsWith("czy");
}

function answerYesOrNo() {
	var responses = [
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
	var response = "";
	var randomResponse = guild.members.fetch()
		.then(users => {
			var usersArray = users.array();
			var randomUser = usersArray[random.roll(usersArray.length)];
			var responses = [
				"to musi być {user}",
				"na pewno {user}",
				"możliwe, że {user}",
				"stawiałbym na {user}",
				"być może {user}",
				"{user}, to o tobie mowa",
				"{user}"
			];
			var randomResponse = responses[random.roll(responses.length)]; 
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
