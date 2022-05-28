const config = require('./config.json');
const dateFormat = require('dateformat');
const dedent = require('dedent-js');
const fs = require('fs');
const random = require('./random.js');

var numOfBaseWords = config.numOfBaseWords;

class WordRef {
	messageIndex;
	wordIndex;

	constructor(messageIndex, wordIndex) {
		this.messageIndex = messageIndex;
		this.wordIndex = wordIndex;
	}
}

class Database {
	#map;

	constructor() {
		this.#map = new Map();
	}

	getKey(keys) {
		return keys.join(' ').toLowerCase();
	}

	add(keys, value) {
		var key = this.getKey(keys);

		if (!this.#map.has(key)) {
			this.#map.set(key, []);
		}

		this.#map.get(key).push(value);
	}

	getRandomAtKey(keys) {
		var key = this.getKey(keys);
		var values = this.#map.get(key);
		return values[random.roll(values.length)];
	}

	forEach(func) {
		this.#map.forEach(func);
	}

	has(keys) {
		return this.#map.has(this.getKey(keys));
	}
}

var messages = new Array();
var messages_new = new Array();
var jumpDatabase = new Database();

function learn(string, saveToFile = true) {
	if (!string) {
		return;
	}

	if (string.indexOf('```') !== -1) {
		return;
	}

	var words = string.trim().split(/[\r\t\n ]+/)

	if (words.length == 0) {
		return;
	} else {
		messages.push(words);
		if (saveToFile) {
			messages_new.push(words);
		}

		var currentMessageIndex = messages.length - 1;

		for (var i = 0; i < (words.length - numOfBaseWords); i++) {
			var wordRef = new WordRef(currentMessageIndex, i + numOfBaseWords);
			var keys = words.slice(i, i + numOfBaseWords)
			jumpDatabase.add(keys, wordRef);
		}
	}
}

function talk() {
	console.log("** I'm gonna talk! **");

	var currentMessageIndex = random.roll(messages.length);
	var currentMessage = messages[currentMessageIndex];

	console.log(`Starting at "${currentMessage.join(' ')}"`);

	if (currentMessage.length < numOfBaseWords) {
		return currentMessage[0];
	}

	var message = currentMessage.slice(0, numOfBaseWords).join(' ');
	var numOfWords = numOfBaseWords;
	var wordIndex = numOfBaseWords;
	console.log(`Current message: "${message}"`);

	var remainingJumps = config.maxWordJumps;

	while (wordIndex < currentMessage.length && numOfWords < config.maxWords) {
		if (remainingJumps > 0 && random.roll(config.chanceToJump) == 0) {
			var randomWordRef = jumpDatabase.getRandomAtKey(
				currentMessage.slice(wordIndex - numOfBaseWords, wordIndex)
			);

			currentMessageIndex = randomWordRef.messageIndex;
			currentMessage      = messages[currentMessageIndex];
			wordIndex           = randomWordRef.wordIndex;

			remainingJumps--;

			console.log(`Jumping to "${currentMessage.join(' ')}", word index ${wordIndex}`);
		}

		message += ` ${currentMessage[wordIndex]}`;
		console.log(`Appending word "${currentMessage[wordIndex]}"`);

		wordIndex++;
		numOfWords++;
	}

	console.log(`Final message: "${message}"`);

	return message;
}

function save() {
	console.log("Saving speech database...");

	if (messages_new.length == 0) {
		console.log("Nothing new to save. ¯\\_(ツ)_/¯");
		return;
	}

	saveDatabase(config.textDatabaseFilename, (fd) => {
		messages_new.forEach((words) => {
			fs.writeSync(fd, words.join(' '));
			fs.writeSync(fd, '\n');
		})
	});

	messages_new = new Array();

	console.log(`Speech database saved.`);
}

function saveDatabase(name, saveFunc) {
	var path = `${config.textDatabaseDir}/${name}`;

	if (!fs.existsSync(config.textDatabaseDir)) {
		fs.mkdirSync(config.textDatabaseDir, { recursive: true });
	}

	if (fs.existsSync(path) && config.doBackups) {
		var timestamp = dateFormat(
			new Date(),
			"ddmmyyyy_HHMMss"
		);
		fs.copyFileSync(path, `${path}.backup_${timestamp}`);
	}

	var fd = fs.openSync(path, 'a');

	saveFunc(fd);

	fs.closeSync(fd);
}

function load() {
	loadDatabase("messages", (words) => {
		learn(words.join(' '), false);
	});

	console.log(`Loaded ${messages.length} messages.`);
}

function loadDatabase(name, loadFunc) {
	var path = `${config.textDatabaseDir}/${name}`;
	if (!fs.existsSync(path)) {
		return;
	}

	var rawTextDatabase = fs.readFileSync(path, 'utf8');

	rawTextDatabase.split('\n').forEach((line) => {
		if (!line) {
			return;
		}

		var words = line.split(' ');
		loadFunc(words);
	});
}

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

function dump() {
	return dedent`
		Messages in brain: ${messages.length}
	`;
}

module.exports.load = load;
module.exports.save = save;
module.exports.learn = learn;
module.exports.talk = talk;
module.exports.amIMentioned = amIMentioned;
module.exports.isUserMentioned = isUserMentioned;
module.exports.isYesOrNoQuestion = isYesOrNoQuestion;
module.exports.answerYesOrNo = answerYesOrNo;
module.exports.isQuestionAboutPerson = isQuestionAboutPerson;
module.exports.choosePerson = choosePerson;
module.exports.isDumpRequest = isDumpRequest;
module.exports.dump = dump;
