import { CustomCommandSource, system } from "@minecraft/server";

export class VanillaCommand {
    customCommand;
    callback;

    constructor(customCommand, callback) {
        this.customCommand = customCommand;
        this.callback = callback;
        this.setupForRegistry();
    }

    setupForRegistry() {
        system.beforeEvents.startup.subscribe((event) => {
            this.registerCommand(event.customCommandRegistry);
            system.beforeEvents.startup.unsubscribe(this.setupForRegistry.bind(this));
        });
    }

    registerCommand(customCommandRegistry) {
        this.registerEnums(customCommandRegistry);
        this.registerSingleCommand(customCommandRegistry);
        this.registerAliasCommands(customCommandRegistry);
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
}