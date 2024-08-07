import config from '../config.json' with { type: 'json' };
import dedent from 'dedent-js';
import * as dateFormat from 'dateformat';
import * as fs from 'fs';
import * as random from './random.js';

let numOfBaseWords = config.numOfBaseWords;

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
		let key = this.getKey(keys);

		if (!this.#map.has(key)) {
			this.#map.set(key, []);
		}

		this.#map.get(key).push(value);
	}

	getRandomAtKey(keys) {
		let key = this.getKey(keys);
		let values = this.#map.get(key);
		return values[random.roll(values.length)];
	}

	forEach(func) {
		this.#map.forEach(func);
	}

	has(keys) {
		return this.#map.has(this.getKey(keys));
	}
}

let messages = new Array();
let messages_new = new Array();
let jumpDatabase = new Database();

export function learn(string, saveToFile = true) {
	if (!string) {
		return;
	}

	if (string.indexOf('```') !== -1) {
		return;
	}

	let words = string.trim().split(/[\r\t\n ]+/)

	if (words.length == 0) {
		return;
	} else {
		messages.push(words);
		if (saveToFile) {
			messages_new.push(words);
		}

		let currentMessageIndex = messages.length - 1;

		for (let i = 0; i < (words.length - numOfBaseWords); i++) {
			let wordRef = new WordRef(currentMessageIndex, i + numOfBaseWords);
			let keys = words.slice(i, i + numOfBaseWords)
			jumpDatabase.add(keys, wordRef);
		}
	}
}

export function talk() {
	console.log("** I'm gonna talk! **");

	if (messages.length == 0) {
		return '...';
	}

	let currentMessageIndex = random.roll(messages.length);
	let currentMessage = messages[currentMessageIndex];

	console.log(`Starting at "${currentMessage.join(' ')}"`);

	if (currentMessage.length < numOfBaseWords) {
		return currentMessage[0];
	}

	let message = currentMessage.slice(0, numOfBaseWords).join(' ');
	let numOfWords = numOfBaseWords;
	let wordIndex = numOfBaseWords;
	console.log(`Current message: "${message}"`);

	let remainingJumps = config.maxWordJumps;

	while (wordIndex < currentMessage.length && numOfWords < config.maxWords) {
		if (remainingJumps > 0 && random.roll(config.chanceToJump) == 0) {
			let randomWordRef = jumpDatabase.getRandomAtKey(
				currentMessage.slice(wordIndex - numOfBaseWords, wordIndex)
			);

			currentMessageIndex = randomWordRef.messageIndex;
			currentMessage = messages[currentMessageIndex];
			wordIndex = randomWordRef.wordIndex;

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

export function save() {
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
	let path = `${config.textDatabaseDir}/${name}`;

	if (!fs.existsSync(config.textDatabaseDir)) {
		fs.mkdirSync(config.textDatabaseDir, { recursive: true });
	}

	if (fs.existsSync(path) && config.doBackups) {
		let timestamp = dateFormat(
			new Date(),
			"ddmmyyyy_HHMMss"
		);
		fs.copyFileSync(path, `${path}.backup_${timestamp}`);
	}

	let fd = fs.openSync(path, 'a');

	saveFunc(fd);

	fs.closeSync(fd);
}

export function load() {
	loadDatabase("messages", (words) => {
		learn(words.join(' '), false);
	});

	console.log(`Loaded ${messages.length} messages.`);
}

function loadDatabase(name, loadFunc) {
	let path = `${config.textDatabaseDir}/${name}`;
	if (!fs.existsSync(path)) {
		return;
	}

	let rawTextDatabase = fs.readFileSync(path, 'utf8');

	rawTextDatabase.split('\n').forEach((line) => {
		if (!line) {
			return;
		}

		let words = line.split(' ');
		loadFunc(words);
	});
}

export function dump() {
	return dedent`
		Messages in brain: ${messages.length}
	`;
}
