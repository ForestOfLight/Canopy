import IPC from "../ipc/ipc";
import { Command } from "./Command";
import { Rule } from "./Rule";
import { parseDPValue } from "../../include/utils";

class Extension {
    id = null;
    commands = [];
    rules = [];

    constructor({ name, version, author, description, isEndstone = false }) {
        this.id = this.#makeID(name);
        this.name = name;
        this.version = version;
        this.author = author;
        if (typeof description == 'string')
            description = { text: description };
        this.description = description;
        this.isEndstone = isEndstone;

        this.#checkArgs();
        this.#setupCommandRegistration();
        this.#setupRuleRegistration();
        this.#sendReadyEvent();
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

    getRule(identifier) {
        return this.rules.find(rule => rule.getID() === identifier);
    }

    async getRuleValue(identifier) {
        return await IPC.invoke(`canopyExtension:${this.id}:ruleValueRequest`, { ruleID: identifier }).then(result => 
            parseDPValue(result)
        );
    }

    setRuleValue(identifier, value) {
        IPC.send(`canopyExtension:${this.id}:ruleValueSet`, { ruleID: identifier, value: value });
    }

    runCommand(name, sender, args) {
        if (this.isEndstone)
            return sender.runCommand(`${name} ${args.join(' ')}`);
        IPC.send(`canopyExtension:${this.id}:commandCallbackRequest`, { 
            commandName: name,
            senderName: sender?.name,
            args: args
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

    #setupCommandRegistration() {
        IPC.on(`canopyExtension:${this.id}:registerCommand`, (cmdData) => {
            this.commands.push(new Command(cmdData));
        });
    }

    #setupRuleRegistration() {
        IPC.on(`canopyExtension:${this.id}:registerRule`, (ruleData) => {
            this.rules.push(new Rule({ category: "Rules", ...ruleData }));
        });
    }

    #sendReadyEvent() {
        IPC.send(`canopyExtension:${this.id}:ready`);
    }
}

export { Extension };