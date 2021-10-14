const config = require('./config.json');
const speech = require('./speech.js');
const random = require('./random.js');

function start() {
	speech.load();
}

function process(msg) {
	if (msg.author.bot)
		return;

	for (const reaction of config.predefinedReactions) {
		var regexp = new RegExp(reaction[0]);
		if (regexp.test(msg.content)) {
			msg.channel.send(reaction[1]);
			return;
		}
	}

	if (config.ignoredChannels.includes(msg.channel.name)) {
		return;
	}

	if (speech.amIMentioned(msg)) {
		if (speech.isQuestionAboutPerson(msg.content)) {
			speech.choosePerson(msg.guild).then(
				response => msg.channel.send(response)
			);
		} else if (speech.isYesOrNoQuestion(msg.content)) {
			msg.channel.send(speech.answerYesOrNo());
		} else {
			msg.channel.send(speech.talk());
		}
	} else {
		speech.learn(msg.content);

		if (random.roll(config.chanceToTalk) == 0) {
			msg.channel.send(speech.talk());
		}
	}
}

function save() {
	speech.save();
}

module.exports.start = start;
module.exports.process = process;
module.exports.save = save;
