import { Block, CustomCommandSource, Entity, Player, system } from "@minecraft/server";
import { Rules } from "./Rules";

export class VanillaCommand {
    customCommand;

    constructor(customCommand) {
        this.customCommand = customCommand;
        this.setupForRegistry();
    }

    setupForRegistry() {
        system.beforeEvents.startup.subscribe((event) => {
            this.registerCommand(event.customCommandRegistry);
            system.beforeEvents.startup.unsubscribe(this.setupForRegistry.bind(this));
        });
    }

    registerCommand(customCommandRegistry) {
        this.addPreCallback();
        this.registerEnums(customCommandRegistry);
        this.registerSingleCommand(customCommandRegistry);
        this.registerAliasCommands(customCommandRegistry);
    }

    addPreCallback() {
        this.callback = (origin, ...args) => {
            const source = VanillaCommand.resolveCommandSource(origin);
            VanillaCommand.addSendMessageMethod(source);
            const disabledContingentRules = this.#getDisabledContingentRules();
            this.#printDisabledContingentRules(disabledContingentRules, source);
            if (disabledContingentRules.length > 0)
                return;
            return this.customCommand.callback(source, ...args);
        }
    }

    registerEnums(customCommandRegistry) {
        if (this.customCommand.enums) {
            for (const customEnum of this.customCommand.enums)
                customCommandRegistry.registerEnum(customEnum.name, customEnum.values);
        }
    }

    registerSingleCommand(customCommandRegistry, name = this.customCommand.name) {
        customCommandRegistry.registerCommand({
            name: name,
            description: this.customCommand.description,
            permissionLevel: this.customCommand.permissionLevel,
            mandatoryParameters: this.customCommand.mandatoryParameters,
            optionalParameters: this.customCommand.optionalParameters,
            cheatsRequired: this.customCommand.cheatsRequired
        }, this.callback);
    }

    registerAliasCommands(customCommandRegistry) {
        if (this.customCommand.aliases) {
            for (const alias of this.customCommand.aliases)
                this.registerSingleCommand(customCommandRegistry, alias);
        }
    }

    static resolveCommandSource(origin) {
        switch (origin.sourceType) {
            case CustomCommandSource.Block:
                return origin.sourceBlock;
            case CustomCommandSource.Entity:
                return origin.sourceEntity;
            case CustomCommandSource.Server:
                return "Server";
            default:
                return void 0;
        }
    }
    
    static addSendMessageMethod(source) {
        if (source === "Server") 
            source.sendMessage = (message) => console.log(message);
        else if (source instanceof Block || (source instanceof Entity && !(source instanceof Player)))
            source.sendMessage = () => {};
        else if (!source)
            source.sendMessage = (message) => console.warn(`Unknown source type: ${source}`, message);
    }

    #getDisabledContingentRules() {
        const disabledRules = new Array();
        for (const ruleID of this.customCommand.contingentRules || []) {
            const ruleValue = Rules.getNativeValue(ruleID);
            if (!ruleValue)
                disabledRules.push(ruleID);
        }
        return disabledRules;
    }

    #printDisabledContingentRules(disabledContingentRules, source) {
        if (source instanceof Block)
            return;
        for (const ruleID of disabledContingentRules)
            source.sendMessage({ translate: 'rules.generic.blocked', with: [ruleID] });
    }
}