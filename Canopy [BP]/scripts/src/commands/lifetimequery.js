import { CommandPermissionLevel, CustomCommandParamType } from "@minecraft/server";
import { VanillaCommand, PlayerCommandOrigin, ServerCommandOrigin } from "../../lib/canopy/Canopy";
import { lifetimeTrackingCommand } from "./lifetimetracking";

export const LIFETIME_QUERY_ACTIONS = Object.freeze({
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
            optionalParameters: [
                { name: 'entityType', type: CustomCommandParamType.EntityType },
                { name: 'canopy:lifetimeQueryActions', type: CustomCommandParamType.Enum },
                { name: 'useRealTime', type: CustomCommandParamType.Boolean }
            ],
            permissionLevel: CommandPermissionLevel.GameDirectors,
            allowedSources: [PlayerCommandOrigin, ServerCommandOrigin],
            callback: (origin, ...args) => this.lifetimeQueryCommand(origin, ...args),
        });
    }

    lifetimeQueryCommand(origin, entityType, queryType, useRealtime) { // Make sure this command can track itemtypes too
        if (!entityType) {
            origin.sendMessage(this.queryAll(useRealtime));
            return;
        }
        if (queryType)
            origin.sendMessage(this.queryEntity(entityType, queryType, useRealtime));
        else
            origin.sendMessage(this.queryEntity(entityType, false, useRealtime));
    }

    queryAll(useRealTime) {
        return lifetimeTrackingCommand.getWorldLifetimeTracker().getQueryAllMessage(useRealTime);
    }

    queryEntity(entityType, queryType, useRealTime) {
        return lifetimeTrackingCommand.getWorldLifetimeTracker().getQueryEntityMessage(entityType.id, queryType, useRealTime);
    }
}

export const lifetimeQueryCommand = new LifetimeQuery();