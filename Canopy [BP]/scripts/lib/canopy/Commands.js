import { world, system } from "@minecraft/server";
import IPC from "../ipc/ipc";
import { ArgumentParser } from "./ArgumentParser";
import { Rules } from "./Rules";
import { CommandPrefixRequest } from "./extension.ipc";

const ADMIN_ONLY_TAG = 'CanopyAdmin';
const COMMAND_PREFIX = './';

class Commands {
    static #commands = {};
    static #prefix = COMMAND_PREFIX;

    static register(command) {
        if (this.exists(command.getName()))
            throw new Error(`[Canopy] Command with name '${command.getName()}' already exists.`);
        this.#commands[command.getName()] = command;
    }

    static get(name) {
        return this.#commands[name];
    }

    static getAll() {
        return Object.values(this.#commands);
    }

    static exists(name) {
        return this.#commands[name] !== undefined;
    }

    static remove(name) {
        delete this.#commands[name];
    }

    static clear() {
        this.#commands = {};
    }

    static getPrefix() {
        return this.#prefix;
    }

    static getNativeCommands() {
		const result = Object.values(this.#commands).filter(cmd => !cmd.getExtension());
		result.sort((a, b) => a.getName().localeCompare(b.getName()));
		return result;
	}

    static async executeCommand(sender, cmdName, args) {
        if (!this.exists(cmdName))
            return sender.sendMessage({ translate: 'commands.generic.unknown', with: [cmdName, this.getPrefix()] });
        const command = this.get(cmdName);
        if (command.isAdminOnly() && !this.#isAdmin(sender))
            return sender.sendMessage({ translate: 'commands.generic.nopermission' });
        
        await system.run(async () => {
            const disabledContingentRules = await this.#getDisabledContingentRules(command);
            for (const ruleID of disabledContingentRules)
                sender.sendMessage({ translate: 'rules.generic.blocked', with: [ruleID] });
            if (disabledContingentRules.length > 0)
                return;
            
            const parsedArgs = this.#interpretArguments(command, args);
            command.runCallback(sender, parsedArgs);
        });
    }

    static #isAdmin(player) {
        return player.hasTag(ADMIN_ONLY_TAG);
    }

    static async #getDisabledContingentRules(command) {
        const disabledRules = new Array();
        for (const ruleID of command.getContingentRules()) {
            const ruleValue = await Rules.getValue(ruleID);
            if (!ruleValue)
                disabledRules.push(ruleID);
        }
        return disabledRules;
    }

    static #interpretArguments(command, args) {
        const parsedArgs = {};
        command.getArgs().forEach((argData, index) => {
            parsedArgs[argData.name] = this.#interpretArgument(args[index], argData.type);
        });
        return parsedArgs;
    }

    static #interpretArgument(value, type) {
        if (type.includes('|')) {
            const typeList = type.split('|');
            for (const t of typeList) {
                if (this.#matchesExpectedType(value, t))
                    return value;
            }
        } else if (this.#matchesExpectedType(value, type)) {
            return value;
        }
        return null;
    }

    static #matchesExpectedType(value, type) {
        switch (type) {
            case 'array':
                return Array.isArray(value);
            case 'identifier':
                return /@[aepsr]\[/g.test(value) || (/@[aepsr]/g.test(value) && value.length === 2);
            case 'player':
                return typeof value === 'string' && value.startsWith('@') && (value.endsWith('"') || !value.includes(' '));
            default:
                return typeof value === type;
        }
    }

    static #handleGetPrefixRequest() {
        IPC.handle('canopyExtension:commandPrefixRequest', CommandPrefixRequest, () => this.#prefix);
    }

    static #handleChatCommands() {
        world.beforeEvents.chatSend.subscribe((event) => {
            const { sender, message } = event;
            if (!message.startsWith(this.getPrefix()))
                return;
            const parsed = ArgumentParser.parseCommandString(message);
            event.cancel = true;
            this.executeCommand(sender, parsed.name, parsed.args);
        });
    }

    static {
        this.#handleGetPrefixRequest();
        this.#handleChatCommands();
    }
}

export { Commands };