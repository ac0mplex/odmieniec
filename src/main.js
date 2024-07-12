import { Client, Events, GatewayIntentBits } from 'discord.js';
import config from '../config.json' with { type: 'json' };
import * as brain from './brain.js';

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

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.MessageContent
	]
});

client.once(Events.ClientReady, readyClient => {
	console.log(`Logged in as ${readyClient.user.tag}!`);
});

client.on(Events.MessageCreate, msg => brain.process(msg));

setInterval(() => {
	brain.save();
}, Math.floor(config.saveEveryMinutes * 60 * 1000));

client.login(config.token);

