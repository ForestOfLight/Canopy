import IPC from "../ipc/ipc";
import Commands from "./Commands";

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

	constructor({ name, description = { text: '' }, usage, callback, args = [], contingentRules = [], adminOnly = false, helpEntries = [], helpHidden = false, extensionName = undefined }) {
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

		this.#checkMembers();
		this.#helpEntries = this.#helpEntries.map(entry => { if (typeof entry.description === 'string') entry.description = { text: entry.description }; return entry; });
		Commands.register(this);
	}

	#checkMembers() {
		if (!this.#name) throw new Error('[Command] name is required.');
		if (!this.#usage) throw new Error('[Command] usage is required.');
		if (!Array.isArray(this.#args)) throw new Error('[Command] args must be an array.');
		if (!Array.isArray(this.#contingentRules)) throw new Error('[Command] contingentRules must be an array.');
		if (typeof this.#adminOnly !== 'boolean') throw new Error('[Command] adminOnly must be a boolean.');
		if (!Array.isArray(this.#helpEntries)) throw new Error('[Command] helpEntries must be an array.');
		if (this.#extensionName && typeof this.#extensionName !== 'string') throw new Error('[Command] extensionName must be a string.');
	}
	
	getName() {
		return this.#name;
	}
	
	getDescription() {
		return this.#description;
	}
	
	getUsage() {
		return Commands.getPrefix() + this.#usage;
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
	
	sendUsage(sender) {
		sender.sendMessage({ translate: 'commands.generic.usage', with: [Command.prefix + this.#usage] });
	}
}

export default Command;