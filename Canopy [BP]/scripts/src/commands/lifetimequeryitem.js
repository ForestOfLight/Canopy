import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus } from "@minecraft/server";
import { VanillaCommand, PlayerCommandOrigin, ServerCommandOrigin } from "../../lib/canopy/Canopy";
import { lifetimeTrackingCommand } from "./lifetimetracking";
import { LIFETIME_QUERY_ACTIONS } from "./lifetimequery";

export class LifetimeQueryItem extends VanillaCommand {
    worldLifetimeTracker = void 0;

    constructor() {
        super({
            name: 'canopy:lifetimequeryitem',
            description: 'commands.lifetime.query.item',
            optionalParameters: [
                { name: 'itemType', type: CustomCommandParamType.ItemType },
                { name: 'canopy:lifetimeQueryActions', type: CustomCommandParamType.Enum },
                { name: 'useRealTime', type: CustomCommandParamType.Boolean }
            ],
            permissionLevel: CommandPermissionLevel.GameDirectors,
            allowedSources: [PlayerCommandOrigin, ServerCommandOrigin],
            callback: (origin, ...args) => this.lifetimeQueryCommand(origin, ...args),
        });
    }

    lifetimeQueryCommand(origin, itemType, queryType, useRealtime) {
        if (!itemType) {
            origin.sendMessage(this.queryAll(useRealtime));
            return;
        }
        if (queryType === LIFETIME_QUERY_ACTIONS.REALTIME)
            origin.sendMessage(this.queryEntity(itemType, false, true));
        else if (Object.values(LIFETIME_QUERY_ACTIONS).includes(queryType))
            origin.sendMessage(this.queryEntity(itemType, queryType, useRealtime));
        else if (queryType)
            return { status: CustomCommandStatus.Failure, message: 'commands.lifetime.query.invalidaction' };
        else
            origin.sendMessage(this.queryEntity(itemType, false, useRealtime));
    }

    queryAll(useRealTime) {
        return lifetimeTrackingCommand.getWorldLifetimeTracker().getQueryAllMessage(useRealTime);
    }

    queryEntity(itemType, queryType, useRealTime) {
        return lifetimeTrackingCommand.getWorldLifetimeTracker().getQueryEntityMessage(itemType, queryType, useRealTime);
    }

    getEntityType(itemType) {
        return "minecraft:item-" + itemType;
    }
}

export const lifetimeQueryCommand = new LifetimeQueryItem();