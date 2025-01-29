import IPC from "../ipc/ipc";
import Command from "./Command.js";
import Rule from "./Rule.js";

export class Extension {
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

        this.#setupCommandRegistration();
        this.#setupRuleRegistration();
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
            if (typeof cmdData.description === 'string')
                cmdData.description = { text: cmdData.description };
            for (const helpEntry of cmdData.helpEntries) {
                if (typeof helpEntry.description === 'string')
                    helpEntry.description = { text: helpEntry.description };
            }
            this.commands.push(new Command(cmdData));
        });
    }

    #setupRuleRegistration() {
        IPC.on(`canopyExtension:${this.id}:registerRule`, (ruleData) => {
            if (typeof ruleData.description === 'string')
                ruleData.description = { text: ruleData.description };
            this.rules.push(new Rule(ruleData));
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

export default Extension;