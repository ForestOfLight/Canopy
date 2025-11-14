import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus } from "@minecraft/server";
import { VanillaCommand, PlayerCommandOrigin, ServerCommandOrigin } from "../../lib/canopy/Canopy";
import { lifetimeTrackingCommand } from "./lifetimetracking";

export const LIFETIME_QUERY_ACTIONS = Object.freeze({
    LIFETIME: 'lifetime',
    SPAWNING: 'spawning',
    REMOVAL: 'removal',
    REALTIME: 'realtime'
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

    lifetimeQueryCommand(origin, entityType, queryType, useRealtime) {
        if (!entityType) {
            origin.sendMessage(this.queryAll(useRealtime));
            return;
        }
        entityType = entityType.id;
        if (queryType === LIFETIME_QUERY_ACTIONS.REALTIME)
            origin.sendMessage(this.queryEntity(entityType, false, true));
        else if (Object.values(LIFETIME_QUERY_ACTIONS).includes(queryType))
            origin.sendMessage(this.queryEntity(entityType, queryType, useRealtime));
        else if (queryType)
            return { status: CustomCommandStatus.Failure, message: 'commands.lifetime.query.invalidaction' };
        else
            origin.sendMessage(this.queryEntity(entityType, false, useRealtime));
    }

    queryAll(useRealTime) {
        try {
            return lifetimeTrackingCommand.getWorldLifetimeTracker().getQueryAllMessage(useRealTime);
        } catch(error) {
            if (error.message.includes("WorldLifetimeTracker"))
                return { translate: 'commands.lifetime.tracking.not' };
            throw error;
        }
    }

    queryEntity(entityType, queryType, useRealTime) {
        try {
            return lifetimeTrackingCommand.getWorldLifetimeTracker().getQueryEntityMessage(entityType, queryType, useRealTime);
        } catch(error) {
            if (error.message.includes("WorldLifetimeTracker"))
                return { translate: 'commands.lifetime.tracking.not' };
            throw error;
        }
    }
}

export const lifetimeQueryCommand = new LifetimeQuery();