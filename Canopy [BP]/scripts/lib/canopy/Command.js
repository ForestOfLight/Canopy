import { world, system } from '@minecraft/server';
import IPC from 'lib/ipc/ipc';
import ArgumentParser from './ArgumentParser';
import Rule from './Rule';

let commands = {};

class Command {
    #name;
    #description;
    #usage;
    #callback;
    #args;
    #contingentRules;
	#adminOnly;
	#helpEntries;
	#helpHidden;
	#extensionName;
	static prefix = './';

	constructor({ name, description = { text: '' }, usage, callback, args = [], contingentRules = [], adminOnly = false, helpEntries = [], helpHidden = false, extensionName = false }) {
		this.#name = name;
        this.#description = description;
        this.#usage = usage;
        this.#callback = callback;
        this.#args = args;
        this.#contingentRules = contingentRules;
		this.#adminOnly = adminOnly;
		this.#helpEntries = helpEntries;
		this.#helpHidden = helpHidden;
		this.#extensionName = extensionName;

		this.checkMembers();
		let cmd = Command.prefix + this.#name;
		commands[cmd] = this;
	}

	checkMembers() {
		if (!this.#name) throw new Error('[Command] name is required.');
		if (!this.#usage) throw new Error('[Command] usage is required.');
		if (!Array.isArray(this.#args)) throw new Error('[Command] args must be an array.');
		if (!Array.isArray(this.#contingentRules)) throw new Error('[Command] contingentRules must be an array.');
		if (typeof this.#adminOnly !== 'boolean') throw new Error('[Command] adminOnly must be a boolean.');
		if (!Array.isArray(this.#helpEntries)) throw new Error('[Command] helpEntries must be an array.');
		if (this.#extensionName !== false && typeof this.#extensionName !== 'string') throw new Error('[Command] extensionName must be a string.');
	}
	
	getName() {
		return this.#name;
	}
	
	getDescription() {
		return this.#description;
	}
	
	getUsage() {
		return Command.prefix + this.#usage;
	}
	
	getArgs() {
		return this.#args;
	}
	
	getContingentRules() {
		return this.#contingentRules;
	}
	
	isAdminOnly() {
		return this.#adminOnly;
	}
	
	getHelpEntries() {
		return this.#helpEntries;
	}
	
	getExtensionName() {
		return this.#extensionName;
	}

	isHelpHidden() {
		return this.#helpHidden;
	}
	
	runCallback(sender, args) {
		if (this.#extensionName) {
			// console.warn(`[Canopy] Sending ${this.#extensionName} command callback from ${sender?.name}: '${this.#name} ${JSON.stringify(args)}'`);
			IPC.send(`canopyExtension:${this.#extensionName}:commandCallbackRequest`, { 
				commandName: this.#name,
				senderName: sender?.name,
				args: args
			});
			return;
		}
		this.#callback(sender, args);
	}
	
	setUsage(usage) {
		this.#usage = usage;
	}
	
	sendUsage(sender) {
		sender.sendMessage({ translate: 'commands.generic.usage', with: [Command.prefix + this.#usage] });
	}
	
	static getCommands() {
		return commands;
	}

	static getNativeCommands() {
		let result = Object.values(commands).filter(cmd => !cmd.getExtensionName());
		result.sort((a, b) => a.getName().localeCompare(b.getName()));
		return result;
	}
	
	static getCommandsByExtension(extensionName) {
		let result = Object.values(commands).filter(cmd => cmd.getExtensionName() === extensionName);
		result.sort((a, b) => a.getName().localeCompare(b.getName()));
		return result;
	}
	
	static getExtensionNames() {
		return Object.values(commands).map(cmd => cmd.getExtensionName()).filter(name => name);
	}
	
    static checkArg(value, type) {
        let data;
        if (type == 'array' && Array.isArray(value)) data = value;
        else if (type == 'identifier' && /@[aepsr]\[/g.test(value)) data = value;
        else if (type == 'identifier' && /@[aepsr]/g.test(value) && value.length == 2) data = value;
        else if (type == 'player' && value.startsWith('@"') && value.endsWith('"')) data = value;
        else if (type == 'player' && value.startsWith('@') && !value.includes(' ')) data = value;
        else if (type.includes('|')) {
            let ts = type.split('|');
            let tv = typeof value;
            
            if (ts.includes(tv)) data = value;
            else data = null;
        }
        else if (typeof value == type) data = value;
        else data = null;
        
        return data;
    }

	static broadcastPrefix() {
		IPC.send('canopy:commandPrefix', Command.prefix);
	}
}

world.beforeEvents.chatSend.subscribe((event) => {
	const { sender, message } = event;
	
	let [name, ...args] = ArgumentParser.parseArgs(message);
	if (!String(name).startsWith(Command.prefix))
		return;
	event.cancel = true;
	if (!commands[name])
		return sender.sendMessage({ translate: 'commands.generic.unknown', with: [name.replace(Command.prefix,''), Command.prefix] });
	const command = commands[name];
	if (command.isAdminOnly() && !sender.hasTag('CanopyAdmin')) 
		return sender.sendMessage({ translate: 'commands.generic.nopermission' });
	
	system.run( async () => {
		for (let ruleID of command.getContingentRules()) {
			const ruleValue = await Rule.getValue(ruleID);
			if (!ruleValue) {
				return sender.sendMessage({ translate: 'rules.generic.blocked', with: [ruleID] });
			}
		}

		let parsedArgs = {};
		command.getArgs().forEach((argData, index) => {
			try {
				parsedArgs[argData.name] = Command.checkArg(args[index], argData.type);
			} catch {}
		});
		
		command.runCallback(sender, parsedArgs);
	});
});

export default Command;