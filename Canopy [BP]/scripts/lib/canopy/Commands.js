import { world, system } from "@minecraft/server";
import IPC from "../ipc/ipc";

const ADMIN_ONLY_TAG = 'CanopyAdmin';
const COMMAND_PREFIX = './';

export class Commands {
    static #commands = {};
    static #prefix = COMMAND_PREFIX;

    static add(command) {
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
		let result = Object.values(this.#commands).filter(cmd => !cmd.getExtensionName());
		result.sort((a, b) => a.getName().localeCompare(b.getName()));
		return result;
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

    static handleGetPrefixRequest() {
        IPC.on('canopy:getCommandPrefix', () => {
            return this.#prefix;
        });
    }

    static handleChatCommands() {
        world.beforeEvents.chatSend.subscribe((event) => {
            const { sender, message } = event;
            
            let [name, ...args] = ArgumentParser.parseArgs(message);
            if (!String(name).startsWith(this.getPrefix()))
                return;
            name = name.replace(this.getPrefix(), '');
            event.cancel = true;
            if (!this.exists(name))
                return sender.sendMessage({ translate: 'commands.generic.unknown', with: [name, this.getPrefix()] });
            const command = this.get(name);
            if (command.isAdminOnly() && !sender.hasTag(ADMIN_ONLY_TAG))
                return sender.sendMessage({ translate: 'commands.generic.nopermission' });
            
            system.run(async () => {
                for (let ruleID of command.getContingentRules()) {
                    const ruleValue = await Rule.getValue(ruleID);
                    if (!ruleValue) {
                        return sender.sendMessage({ translate: 'rules.generic.blocked', with: [ruleID] });
                    }
                }
                
                let parsedArgs = {};
                command.getArgs().forEach((argData, index) => {
                    try {
                        parsedArgs[argData.name] = this.checkArg(args[index], argData.type);
                    } catch {}
                });
                
                command.runCallback(sender, parsedArgs);
            });
        });
    }
}

Commands.handleGetPrefixRequest();
Commands.handleChatCommands();

export default Commands;