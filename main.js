const Discord = require('discord.js');
const config = require('./config.json');
const brain = require('./brain.js');
const random = require('./random.js');

brain.start();

const saveAndExit = (options) => {
	console.log(`Exitting due to ${options.reason}.`);

	if (options.save) {
		brain.save();
	}

	if (options.exit) {
		process.removeAllListeners('exit');
		process.exit();
	}
};

const exitConditions = {
	exit: { exit: false, save: true },
	SIGINT: { exit: true, save: true },
	SIGTERM: { exit: true, save: true },
	SIGUSR1: { exit: true, save: true },
	SIGUSR2: { exit: true, save: true }
};

for (const [signal, options] of Object.entries(exitConditions)) {
	process.on(
		signal,
		saveAndExit.bind(null, Object.assign({}, options, { reason: signal }))
	);
}

const client = new Discord.Client({
	ws: {
		intents: [
			'GUILDS',
			'GUILD_MEMBERS',
			//'GUILD_BANS',
			//'GUILD_EMOJIS',
			//'GUILD_INTEGRATIONS',
			//'GUILD_WEBHOOKS',
			//'GUILD_INVITES',
			//'GUILD_VOICE_STATES',
			//'GUILD_PRESENCES',
			'GUILD_MESSAGES',
			'GUILD_MESSAGE_REACTIONS',
			//'GUILD_MESSAGE_TYPING',
			//'DIRECT_MESSAGES',
			//'DIRECT_MESSAGE_REACTIONS',
			//'DIRECT_MESSAGE_TYPING',
		]
	}
});

client.once('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => brain.process(msg));

client.setInterval(() => {
	brain.save();
}, Math.floor(config.saveEveryMinutes * 60 * 1000));

client.login(config.token);

