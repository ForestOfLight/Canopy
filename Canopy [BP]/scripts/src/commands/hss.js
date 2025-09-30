import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, system } from "@minecraft/server";
import { VanillaCommand } from "../../lib/canopy/VanillaCommand";
import { HSSFinder } from "../classes/HSSFinder";

const HSS_ACTIONS = Object.freeze({
    FIND: 'find',
    STOP: 'stop',
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
            callback: (source, ...args) => this.hssCommand(source, ...args),
        });
        this.hssFinder = void 0;
    }

    hssCommand(_, action) {
        switch (action) {
            case HSS_ACTIONS.FIND:
                return this.startFindingHSS();
            case HSS_ACTIONS.STOP:
                return this.stopFindingHSS();
            default:
                return { status: CustomCommandStatus.Failure, message: 'commands.hss.invalidaction' };
        }
    }

    startFindingHSS() {
        if (this.hssFinder)
            return { status: CustomCommandStatus.Failure, message: 'commands.hss.alreadyfinding' };
        system.run(() => {
            this.hssFinder = new HSSFinder();
        });
        return { status: CustomCommandStatus.Success, message: 'commands.hss.findingstarted' };
    }

    stopFindingHSS() {
        if (!this.hssFinder)
            return { status: CustomCommandStatus.Failure, message: 'commands.hss.notfinding' };
        system.run(() => {
            this.hssFinder.destroy();
            this.hssFinder = void 0;
        });
        return { status: CustomCommandStatus.Success, message: 'commands.hss.findingstopped' };
    }
}

export const hssCommand = new HSS();