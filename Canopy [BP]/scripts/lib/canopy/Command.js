import { Commands } from "./Commands";
import { Extensions } from "./Extensions";

class Command {
    #name;
    #description;
    #usage;
    #callback;
    #args;
    #contingentRules;
	#OpOnly;
	#helpEntries;
	#helpHidden;
	#extension;

	constructor({ name, description = { text: '' }, usage, callback, args = [], contingentRules = [], opOnly = false, helpEntries = [], helpHidden = false, extensionName = undefined }) {
		this.#name = name;
        this.#description = description;
        this.#usage = usage;
        this.#callback = callback;
        this.#args = args;
        this.#contingentRules = contingentRules;
		this.#OpOnly = opOnly;
		this.#helpEntries = helpEntries;
		this.#helpHidden = helpHidden;
		this.#extension = Extensions.getFromName(extensionName);
		
		this.#checkMembers(extensionName);
		if (typeof this.#description === 'string')
			this.#description = { text: this.#description };
		this.#helpEntries = this.#helpEntries.map(entry => {
			if (typeof entry.description === 'string')
				entry.description = { text: entry.description };
			return entry;
		});
		Commands.register(this);
	}

	#checkMembers(extensionName) {
		if (!this.#name) throw new Error('[Command] name is required.');
		if (!this.#usage) throw new Error('[Command] usage is required.');
		if (!Array.isArray(this.#args)) throw new Error('[Command] args must be an array.');
		if (!Array.isArray(this.#contingentRules)) throw new Error('[Command] contingentRules must be an array.');
		if (typeof this.#OpOnly !== 'boolean') throw new Error('[Command] opOnly must be a boolean.');
		if (!Array.isArray(this.#helpEntries)) throw new Error('[Command] helpEntries must be an array.');
		if (extensionName && !this.#extension) throw new Error('[Command] extensionName must be a valid Extension.');
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
	
	isOpOnly() {
		return this.#OpOnly;
	}
	
	getHelpEntries() {
		return this.#helpEntries;
	}
	
	getExtension() {
		return this.#extension;
	}

	isHelpHidden() {
		return this.#helpHidden;
	}
	
	runCallback(sender, args) {
		if (this.#extension)
			this.#extension.runCommand(sender, this.#name, args);
		else
			this.#callback(sender, args);
	}
	
	sendUsage(sender) {
		sender.sendMessage({ translate: 'commands.generic.usage', with: [this.getUsage()] });
	}
}

export { Command };