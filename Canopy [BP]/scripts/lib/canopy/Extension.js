import IPC from "../ipc/ipc";
import { Command } from "./Command.js";
import { Rule } from "./Rule.js";

class Extension {
    id = null;
    commands = [];
    rules = [];

    constructor({ name, version, author, description }) {
        this.id = this.#makeID(name);
        this.name = name;
        this.version = version;
        this.author = author;
        if (typeof description == 'string')
            description = { text: description };
        this.description = description;

        this.#checkArgs();
        this.#setupCommandRegistration();
        this.#setupRuleRegistration();
    }

    #checkArgs() {
        if (typeof this.name !== 'string' || this.name.length === 0 || this.name.length > 32)
            throw new Error('[Canopy] Extension name must be a string, contain at least one alphanumeric character, and be less than 32 characters.');
        if (!/^\d+\.\d+\.\d+$/.test(this.version))
            throw new Error('[Canopy] Version must be in format #.#.#');
        if (typeof this.author !== 'string' || this.author.length === 0 || this.author.length > 32)
            throw new Error('[Canopy] Extension author must be a string, contain at least one alphanumeric character, and be less than 32 characters.');
        if (typeof this.description !== 'object' || this.description === null)
            throw new Error('[Canopy] Extension description cannot be null.');
    }

    getID() {
        return this.id;
    }

    getName() {
        return this.name;
    }

    getVersion() {
        return this.version;
    }

    getAuthors() {
        return this.author;
    }

    getDescription() {
        return this.description;
    }

    getCommands() {
        return this.commands;
    }

    getRules() {
        return this.rules;
    }

    getCommand(name) {
        return this.commands.find(cmd => cmd.getName() === name);
    }

    getRule(name) {
        return this.rules.find(rule => rule.getID() === name);
    }

    #setupCommandRegistration() {
        IPC.on(`canopyExtension:${this.id}:registerCommand`, (cmdData) => {
            console.warn(`[Canopy] Registering command: ${cmdData.name}`);
            this.commands.push(new Command(cmdData));
        });
    }

    #setupRuleRegistration() {
        IPC.on(`canopyExtension:${this.id}:registerRule`, (ruleData) => {
            console.warn(`[Canopy] Registering rule: ${ruleData.identifier}`);
            this.rules.push(new Rule({ category: "Rules", ...ruleData }));
        });
    }

    #makeID(name) {
        if (typeof name !== 'string')
            throw new Error(`[Canopy] Could not register extension: ${name}. Extension name must be a string.`);
        const id = name.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/ /g, '_');
        if (id.length === 0)
            throw new Error(`[Canopy] Could not register extension: ${name}. Extension name must contain at least one alphanumeric character.`);
        return id;
    }
}

export { Extension };