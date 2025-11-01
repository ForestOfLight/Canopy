import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, system } from "@minecraft/server";
import { VanillaCommand } from "../../lib/canopy/VanillaCommand";
import { HSSFinder } from "../classes/HSSFinder";
import { PlayerCommandOrigin } from "../../lib/canopy/PlayerCommandOrigin";
import { EntityCommandOrigin } from "../../lib/canopy/EntityCommandOrigin";
import { BlockCommandOrigin } from "../../lib/canopy/BlockCommandOrigin";
import { GeneratedStructureError } from "../classes/errors/GeneratedStructureError";

export const HSS_ACTIONS = Object.freeze({
    CALCULATE: 'calculate',
    FORTRESS: 'fortress',
    STOP: 'stop'
});

export class HSS extends VanillaCommand {
    hssFinders = [];
    isFindingFortress = false;

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
        const dimension = source.dimension;
        const location = source.location;
        system.run(() => {
            try {
                this.hssFinders.push(new HSSFinder({ dimension, location, mode: HSS_ACTIONS.CALCULATE }));
            } catch (error) {
                if (error instanceof GeneratedStructureError)
                    source.sendMessage({ rawtext: [ { text: '§c' }, { translate: error.message } ] });
                else
                    throw error;
            }
        });
        return { status: CustomCommandStatus.Success, message: 'commands.hss.started' };
    }

    startFindingFortressHSS() {
        if (this.isFindingFortress)
            return { status: CustomCommandStatus.Failure, message: 'commands.hss.alreadyrunning' };
        system.run(() => {
            this.hssFinders.push(new HSSFinder({ mode: HSS_ACTIONS.FORTRESS }));
            this.isFindingFortress = true;
        });
        return { status: CustomCommandStatus.Success, message: 'commands.hss.started.fortress' };
    }

    stopFindingHSS() {
        if (this.hssFinders.length === 0)
            return { status: CustomCommandStatus.Failure, message: 'commands.hss.notrunning' };
        system.run(() => {
            this.hssFinders.forEach((hssFinder) => hssFinder.destroy());
            this.hssFinders.length = 0;
            this.isFindingFortress = false;
        });
        return { status: CustomCommandStatus.Success, message: 'commands.hss.stopped' };
    }
}

export const hssCommand = new HSS();