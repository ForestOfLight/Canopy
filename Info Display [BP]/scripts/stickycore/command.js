import * as mc from '@minecraft/server'
import Parser from './src/regex'

let commands = {};
class Command {
	// Builder
	#data;
	static prefix = './';	
	constructor(data = {}) {
		this.#data = data;
	}
	
	build() {
		let cmd = Command.prefix + this.#data.name;
		
		if (!this.#data.args) this.#data.args = [];
		if (!this.#data.description) this.#data.description = '';
		
		commands[cmd] = this.#data;
		return commands[cmd];
	}
	
	static getCommands() {
		return commands;
	}
	
	
	// Options
	setName(name) {
		this.#data.name = name;
		return this;
	}
	
	setDescription(description) {
		this.#data.description = description;
		return this;
	}
	
	setCallback(callback) {
		this.#data.callback = callback;
		return this;
	}
	
	addArgument(type, name) {
		if (!this.#data.args) this.#data.args = [];
		const types = [
			'string',
			'number',
			'boolean',
			'array',
			'player',
			'identifier'
		];
		
		this.#data.args.push({ type, name });
		return this;
	}
}

function checkArg(value, type) {
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


mc.world.beforeEvents.chatSend.subscribe((ev) => {
	const { message, sender } = ev;
	
	let [name, ...args] = Parser(message);
	if (!name.startsWith(Command.prefix)) return;
	ev.cancel = true;
	if (!commands[name]) return sender.sendMessage(`§cInvalid command: '${name.replace('./','')}'.  Use ./help for more information.`);
	
	mc.system.run(() => {
		let cmd = commands[name];
		let parsedArgs = {};
		cmd.args.forEach((argData, index) => {
			try {
				parsedArgs[argData.name] = checkArg(args[index], argData.type);
			} catch {}
		});
		
		let vals = Object.values(parsedArgs);
		if (vals.includes(null) || vals.length < args.length || vals.length > args.length) return sender.sendMessage('§cSyntax error. Use ./help for more information.');
		cmd.callback(sender, parsedArgs);
	});
});

export default Command;