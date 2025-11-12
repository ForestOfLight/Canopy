import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus } from "@minecraft/server";
import { VanillaCommand, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../../lib/canopy/Canopy";

const LIFETIME_TRACKING_ACTIONS = Object.freeze({
    START: 'start',
    STOP: 'stop',
    RESTART: 'restart'
});

export class LifetimeTracking extends VanillaCommand {
    constructor() {
        super({
            name: 'canopy:lifetimetracking',
            description: 'commands.lifetime.tracking',
            enums: [{ name: 'canopy:lifetimeTrackingActions', values: Object.values(LIFETIME_TRACKING_ACTIONS) }],
            optionalParameters: [{ name: 'canopy:lifetimeTrackingActions', type: CustomCommandParamType.Enum }],
            permissionLevel: CommandPermissionLevel.GameDirectors,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin],
            callback: (origin, ...args) => this.lifetimeTrackingCommand(origin, ...args),
        });
    }

    lifetimeTrackingCommand(origin, action) {
        
    }
}

export const lifetimeTrackingCommand = new LifetimeTracking();