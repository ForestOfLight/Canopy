import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus } from "@minecraft/server";
import { VanillaCommand, PlayerCommandOrigin, ServerCommandOrigin } from "../../lib/canopy/Canopy";

const LIFETIME_QUERY_ACTIONS = Object.freeze({
    LIFETIME: 'lifetime',
    SPAWNING: 'spawning',
    REMOVAL: 'removal'
});

export class LifetimeQuery extends VanillaCommand {
    worldLifetimeTracker = void 0;

    constructor() {
        super({
            name: 'canopy:lifetimequery',
            description: 'commands.lifetime.query',
            enums: [{ name: 'canopy:lifetimeQueryActions', values: Object.values(LIFETIME_QUERY_ACTIONS) }],
            mandatoryParameters: [{ name: 'entityType', type: CustomCommandParamType.EntityType }],
            optionalParameters: [
                { name: 'canopy:lifetimeQueryActions', type: CustomCommandParamType.Enum },
                { name: 'useRealTime', type: CustomCommandParamType.Boolean }
            ],
            permissionLevel: CommandPermissionLevel.GameDirectors,
            allowedSources: [PlayerCommandOrigin, ServerCommandOrigin],
            callback: (origin, ...args) => this.lifetimeQueryCommand(origin, ...args),
        });
    }

    lifetimeQueryCommand(origin, entityType, queryType, useRealtime) { // Make sure this command can track itemtypes too
        
    }
}

export const lifetimeQueryCommand = new LifetimeQuery();