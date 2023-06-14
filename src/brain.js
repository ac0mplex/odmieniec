const config = require('../config.json');
const dedent = require('dedent-js')
const freeWill = require('./free_will.js');
const speech = require('./speech.js');
const randomSpeech = require('./random_speech.js');

function start() {
	randomSpeech.load();
}

function process(msg) {
	if (msg.author.bot) {
		return;
	}

	if (config.ignoredChannels.includes(msg.channel.name)) {
		return;
	}

	for (const reaction of config.predefinedReactions) {
		let flags = reaction.length >= 3 ? reaction[2] : "";
		let regexp = new RegExp(reaction[0], flags);
		if (regexp.test(msg.content)) {
			msg.channel.send(reaction[1]);
			return;
		}
	}

	if (speech.amIMentioned(msg)) {
		if (speech.isQuestionAboutPerson(msg.content)) {
			speech.choosePerson(msg.guild).then(
				response => msg.channel.send(response)
			);
		} else if (speech.isYesOrNoQuestion(msg.content)) {
			msg.channel.send(speech.answerYesOrNo());
		} else if (speech.isDumpRequest(msg.content)) {
			msg.channel.send(dump());
		} else {
			msg.channel.send(randomSpeech.talk());
		}
	} else {
		randomSpeech.learn(msg.content);

		if (freeWill.wantToTalk()) {
			msg.channel.send(randomSpeech.talk());
		}
	}
}

function dump() {
	return dedent`
		RANDOM SPEECH:
		${randomSpeech.dump()}

		FREE WILL:
		${freeWill.dump()}
	`;
}

function save() {
	randomSpeech.save();
}

module.exports.start = start;
module.exports.process = process;
module.exports.save = save;
