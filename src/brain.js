import config from '../config.json' assert { type: 'json' };
import dedent from 'dedent-js';
import { PermissionFlagsBits } from 'discord.js';
import * as freeWill from './free_will.js';
import * as speech from './speech.js';
import * as randomSpeech from './random_speech.js';

export function start() {
	randomSpeech.load();
}

export function process(msg) {
	if (msg.system || msg.author.bot) {
		return;
	}

	if (msg.channel.name == config.recruitmentChannel) {
		tryRecruit(msg);
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

function tryRecruit(msg) {
	if (!msg.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
		console.error("I can't recruit. I don't have permission to manage roles!");
		return;
	}

	let userRoles = msg.member.roles.cache;
	let isVerified = userRoles.some(
		role => role.name == config.verifiedRole
	);

	if (isVerified) {
		return;
	}

	let genderRoleName = assignGenderRole(msg.content);

	if (genderRoleName == null) {
		return;
	}

	let roles = msg.guild.roles.cache;

	let verifiedRole = findRoleByName(roles, config.verifiedRole);
	if (verifiedRole == null) {
		console.error(`I can't recruit. Missing role ${config.verifiedRole}.`);
		return;
	}

	let genderRole = findRoleByName(roles, genderRoleName);
	if (genderRole == null) {
		console.error(`I can't recruit. Missing role ${genderRoleName}.`);
		return;
	}

	msg.member.roles.add([verifiedRole, genderRole]);

	console.log(`${msg.author.username} recruited! (gender role: ${genderRoleName}, message: ${msg.content})`);

	let welcomeChannel = msg.guild.channels.cache.find(
		channel => channel.name == config.welcomeChannel
	);
	if (welcomeChannel == null) {
		console.error(`I can't find the welcome channel "${config.welcomeChannel}"!`);
		return;
	}

	welcomeChannel.send(`${msg.author} ${config.welcomeMessage}`);
}

function findRoleByName(roles, name) {
	for (const [_snowflake, role] of roles.entries()) {
		if (role.name == name) {
			return role;
		}
	}

	return null;
}

function assignGenderRole(msgContent) {
	const msgContentLowercase = msgContent.toLowerCase();

	const malePatterns = [
		"ch[lł]*o+p",
		"m[ęe]+[żz]czy+zn[aą]+",
		"fa+ce+t",
		"m[ęe]+sk+"
	]
	const femalePatterns = [
		"ba+b[aą]+",
		"ba+be+czk[aą]+",
		"ko+bi+e+t[aą]+",
		"[żz]e+[ńn]sk",
		"dzi+e+wczy+n"
	]

	for (const pattern of malePatterns) {
		let regexp = new RegExp(pattern, "i");
		if (regexp.test(msgContentLowercase)) {
			return config.maleRole;
		}
	}

	for (const pattern of femalePatterns) {
		let regexp = new RegExp(pattern, "i");
		if (regexp.test(msgContentLowercase)) {
			return config.femaleRole;
		}
	}

	return null;
}

function dump() {
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
