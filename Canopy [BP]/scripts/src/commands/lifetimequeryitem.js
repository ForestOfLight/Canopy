import { CommandPermissionLevel, CustomCommandParamType } from "@minecraft/server";
import { VanillaCommand, PlayerCommandOrigin, ServerCommandOrigin } from "../../lib/canopy/Canopy";
import { lifetimeQueryCommand } from "./lifetimequery";

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
            callback: (origin, ...args) => this.lifetimeQueryItemCommand(origin, ...args),
        });
    }

    lifetimeQueryItemCommand(origin, itemType, queryType, useRealtime) {
        return lifetimeQueryCommand.lifetimeQueryCommand(origin, this.getEntityType(itemType), queryType, useRealtime);
    }

    getEntityType(itemType) {
        return { id: "minecraft:item-" + itemType.id };
    }
}

export const lifetimeQueryItemCommand = new LifetimeQueryItem();