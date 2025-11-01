import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, system } from "@minecraft/server";
import { VanillaCommand } from "../../lib/canopy/VanillaCommand";
import { HSSFinder } from "../classes/HSSFinder";
import { PlayerCommandOrigin } from "../../lib/canopy/PlayerCommandOrigin";
import { EntityCommandOrigin } from "../../lib/canopy/EntityCommandOrigin";
import { BlockCommandOrigin } from "../../lib/canopy/BlockCommandOrigin";

export const HSS_ACTIONS = Object.freeze({
    CALCULATE: 'calculate',
    FORTRESS: 'fortress',
    STOP: 'stop'
});

export class HSS extends VanillaCommand {
    hssFinder;

    constructor() {
        super({
            name: 'canopy:hss',
            description: 'commands.hss',
            enums: [{ name: 'canopy:hssAction', values: Object.values(HSS_ACTIONS) }],
            mandatoryParameters: [ { name: 'canopy:hssAction', type: CustomCommandParamType.Enum } ],
            permissionLevel: CommandPermissionLevel.GameDirectors,
            allowedSources: [PlayerCommandOrigin, EntityCommandOrigin, BlockCommandOrigin],
            callback: (origin, ...args) => this.hssCommand(origin, ...args),
        });
        this.hssFinder = void 0;
    }

    hssCommand(origin, action) {
        const source = origin.getSource();
        switch (action) {
            case HSS_ACTIONS.CALCULATE:
                return this.calculateHSS(source);
            case HSS_ACTIONS.FORTRESS:
                return this.startFindingFortressHSS();
            case HSS_ACTIONS.STOP:
                return this.stopFindingHSS();
            default:
                return { status: CustomCommandStatus.Failure, message: 'commands.hss.invalidaction' };
        }
    }

    calculateHSS(source) {
        if (this.hssFinder)
            return { status: CustomCommandStatus.Failure, message: 'commands.hss.alreadyrunning' };
        const dimension = source.dimension;
        const location = source.location;
        system.run(() => {
            this.hssFinder = new HSSFinder({ dimension, location, mode: HSS_ACTIONS.CALCULATE });
        });
        return { status: CustomCommandStatus.Success, message: 'commands.hss.started' };
    }

    startFindingFortressHSS() {
        if (this.hssFinder)
            return { status: CustomCommandStatus.Failure, message: 'commands.hss.alreadyrunning' };
        system.run(() => {
            this.hssFinder = new HSSFinder({ mode: HSS_ACTIONS.FORTRESS });
        });
        return { status: CustomCommandStatus.Success, message: 'commands.hss.started.fortress' };
    }

    stopFindingHSS() {
        if (!this.hssFinder)
            return { status: CustomCommandStatus.Failure, message: 'commands.hss.notrunning' };
        system.run(() => {
            this.hssFinder.destroy();
            this.hssFinder = void 0;
        });
        if (this.hssFinder.isFortress)
            return { status: CustomCommandStatus.Success, message: 'commands.hss.stopped.fortress' };
        return { status: CustomCommandStatus.Success, message: 'commands.hss.stopped' };
    }
}

export const hssCommand = new HSS();