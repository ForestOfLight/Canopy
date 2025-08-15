import { CustomCommandSource, CustomCommandStatus, Player, system } from "@minecraft/server";
import { Rules } from "./Rules";
import { BlockCommandOrigin } from "./BlockCommandOrigin";
import { EntityCommandOrigin } from "./EntityCommandOrigin";
import { ServerCommandOrigin } from "./ServerCommandOrigin";
import { PlayerCommandOrigin } from "./PlayerCommandOrigin";

export class VanillaCommand {
    customCommand;

    constructor(customCommand) {
        this.customCommand = customCommand;
        this.setDefaultArgs();
        system.beforeEvents.startup.subscribe(this.setupForRegistry.bind(this));
    }

    setupForRegistry(startupEvent) {
        this.registerCommand(startupEvent.customCommandRegistry);
        system.beforeEvents.startup.unsubscribe(this.setupForRegistry.bind(this));
    }

    registerCommand(customCommandRegistry) {
        this.addPreCallback();
        this.registerEnums(customCommandRegistry);
        this.registerSingleCommand(customCommandRegistry);
        this.registerAliasCommands(customCommandRegistry);
    }

    setDefaultArgs() {
        if (this.customCommand.cheatsRequired === void 0)
            this.customCommand.cheatsRequired = false;
    }

    addPreCallback() {
        this.callback = (origin, ...args) => {
            const source = VanillaCommand.resolveCommandOrigin(origin);
            const disabledContingentRules = this.#getDisabledContingentRules();
            this.#printDisabledContingentRules(disabledContingentRules, source);
            if (disabledContingentRules.length > 0)
                return;
            if (this.commandSourceIsNotAllowed(source))
                return { status: CustomCommandStatus.Failure, message: 'commands.generic.invalidsource' };
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

    isCheatsRequired() {
        return this.customCommand.cheatsRequired;
    }

    static resolveCommandOrigin(origin) {
        switch (origin.sourceType) {
            case CustomCommandSource.Block:
                return new BlockCommandOrigin(origin);
            case CustomCommandSource.Entity:
                if (origin.sourceEntity instanceof Player)
                    return new PlayerCommandOrigin(origin);
                return new EntityCommandOrigin(origin);
            case CustomCommandSource.Server:
                return new ServerCommandOrigin(origin);
            default:
                throw new Error("Unknown command source: " + origin?.sourceType);
        }
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
        for (const ruleID of disabledContingentRules)
            source.sendMessage({ translate: 'rules.generic.blocked', with: [ruleID] });
    }

    commandSourceIsNotAllowed(source) {
        if (!this.customCommand.allowedSources)
            return false;
        return !this.customCommand.allowedSources.includes(source.constructor);
    }
}