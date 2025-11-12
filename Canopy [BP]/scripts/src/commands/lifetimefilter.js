import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus } from "@minecraft/server";
import { VanillaCommand, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../../lib/canopy/Canopy";

const LIFETIME_FILTER_ACTIONS = Object.freeze({
    SET: 'set',
    CLEAR: 'clear'
});

export class LifetimeFilter extends VanillaCommand {
    constructor() {
        super({
            name: 'canopy:lifetimefilter',
            description: 'commands.lifetime.filter',
            enums: [{ name: 'canopy:lifetimeFilterActions', values: Object.values(LIFETIME_FILTER_ACTIONS) }],
            mandatoryParameters: [
                { name: 'entityType', type: CustomCommandParamType.EntityType },
                { name: 'canopy:lifetimeFilterActions', type: CustomCommandParamType.Enum }
            ],
            optionalParameters: [{ name: 'entityFilter', type: CustomCommandParamType.EntitySelector }],
            permissionLevel: CommandPermissionLevel.GameDirectors,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin],
            callback: (origin, ...args) => this.lifetimeFilterCommand(origin, ...args),
        });
    }

    lifetimeFilterCommand(origin, entityType, action, entityTypeTwo) {
        
    }
}

export const lifetimeFilterCommand = new LifetimeFilter();