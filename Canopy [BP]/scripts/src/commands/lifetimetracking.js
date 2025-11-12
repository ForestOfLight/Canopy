import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, system } from "@minecraft/server";
import { VanillaCommand, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../../lib/canopy/Canopy";
import { WorldLifetimeTracker } from "../classes/WorldLifetimeTracker";

const LIFETIME_TRACKING_ACTIONS = Object.freeze({
    START: 'start',
    STOP: 'stop',
    RESTART: 'restart'
});

export class LifetimeTracking extends VanillaCommand {
    worldLifetimeTracker = void 0;

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
        switch(action) {
            case LIFETIME_TRACKING_ACTIONS.START:
                return this.start();
            case LIFETIME_TRACKING_ACTIONS.STOP:
                return this.stop();
            case LIFETIME_TRACKING_ACTIONS.RESTART:
                return this.restart();
            default:
                return { status: CustomCommandStatus.Failure, message: 'commands.lifetime.tracking.unknownaction' };
        }
    }

    start() {
        if (this.worldLifetimeTracker)
            return { status: CustomCommandStatus.Failure, message: 'commands.lifetime.tracking.already' };
        system.run(() => {
            this.worldLifetimeTracker = new WorldLifetimeTracker()
        });
        return { status: CustomCommandStatus.Success, message: 'commands.lifetime.tracking.start' };
    }

    stop() {
        if (!this.worldLifetimeTracker)
            return { status: CustomCommandStatus.Failure, message: 'commands.lifetime.tracking.not' };
        this.worldLifetimeTracker.stopCollecting();
        return { status: CustomCommandStatus.Success, message: 'commands.lifetime.tracking.stop' };
    }

    restart() {
        this.stop();
        this.start();
        return { status: CustomCommandStatus.Success, message: 'commands.lifetime.tracking.restart' };
    }

    getWorldLifetimeTracker() {
        if (this.worldLifetimeTracker)
            return this.worldLifetimeTracker;
        throw new Error('[Canopy] WorldLifetimeTracker is not instantiated.');
    }
}

export const lifetimeTrackingCommand = new LifetimeTracking();