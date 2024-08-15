import { world, system } from '@minecraft/server';
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
	#extensionName;
	static prefix = './';

	constructor({ name, description = '', usage, callback, args = [], contingentRules = [], adminOnly = false, extensionName = false }) {
		this.#name = name;
        this.#description = description;
        this.#usage = usage;
        this.#callback = callback;
        this.#args = args;
        this.#contingentRules = contingentRules;
		this.#adminOnly = adminOnly;
		this.#extensionName = extensionName;

		let cmd = Command.prefix + this.#name;
		commands[cmd] = this;
	}
	
	static getCommands() {
		return commands;
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

	getUsage() {
		return Command.prefix + this.#usage;
	}

	sendUsage(sender) {
		sender.sendMessage(`§cUsage: ${Command.prefix}${this.#usage}`);
	}

	runCallback(sender, args) {
		if (this.#extensionName) {
			// console.warn(`[Canopy] Sending ${this.#extensionName} command callback: '${this.#name} ${JSON.stringify(args)}'`);
			world.getDimension('overworld').runCommandAsync(`scriptevent canopyExtension:commandCallback ${this.#extensionName} ${sender?.name} ${this.#name} ${JSON.stringify(args)}`);
			return;
		}
		this.#callback(sender, args);
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
		world.getDimension('overworld').runCommandAsync(`scriptevent canopyExtension:commandPrefix ${Command.prefix}`);
	}
}

world.beforeEvents.chatSend.subscribe((ev) => {
	const { message, sender } = ev;
	
	let [name, ...args] = ArgumentParser.parseArgs(message);
	if (!name.startsWith(Command.prefix)) return;
	ev.cancel = true;
	if (!commands[name]) 
		return sender.sendMessage(`§cInvalid command: '${name.replace('./','')}'. Use ./help for more information.`);
	const command = commands[name];
	if (command.isAdminOnly() && !sender.hasTag('CanopyAdmin')) 
		return sender.sendMessage(`§cYou do not have permission to use this command.`);
	for (let rule of command.getContingentRules()) {
		if (!Rule.getRule(rule).getValue()) return sender.sendMessage(`§cThe ${rule} rule is disabled.`);
	}
	
	system.run(() => {
		let cmd = command;
		let parsedArgs = {};
		cmd.getArgs().forEach((argData, index) => {
			try {
				parsedArgs[argData.name] = Command.checkArg(args[index], argData.type);
			} catch {}
		});
		
		cmd.runCallback(sender, parsedArgs);
	});
});

export default Command;