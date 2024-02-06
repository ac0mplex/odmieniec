import config from '../config.json' assert { type: 'json' };
import dedent from 'dedent-js';
import * as freeWill from './free_will.js';
import * as speech from './speech.js';
import * as randomSpeech from './random_speech.js';

export function start() {
	randomSpeech.load();
}

export function process(msg) {
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

export function dump() {
	return dedent`
		RANDOM SPEECH:
		${randomSpeech.dump()}

		FREE WILL:
		${freeWill.dump()}
	`;
}

export function save() {
	randomSpeech.save();
}
