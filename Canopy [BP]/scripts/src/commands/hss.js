import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, system } from "@minecraft/server";
import { VanillaCommand } from "../../lib/canopy/VanillaCommand";
import { StartStop } from "./CommandEnums";
import { HSSFinder } from "../classes/HSSFinder";

const HSS_ACTIONS = Object.freeze({
    FIND: 'find',
    SHOW: 'show',
});

export class HSS extends VanillaCommand {
    hssFinders;

    constructor() {
        super({
            name: 'canopy:hss',
            description: 'commands.hss',
            enums: [{ name: 'canopy:hssAction', values: Object.values(HSS_ACTIONS) }],
            mandatoryParameters: [
                { name: 'canopy:hssAction', type: CustomCommandParamType.Enum },
                { name: 'canopy:startstop', type: CustomCommandParamType.Enum }
            ],
            permissionLevel: CommandPermissionLevel.GameDirectors,
            callback: (source, ...args) => this.hssCommand(source, ...args),
        });
        this.hssFinders = {};
    }

    hssCommand(source, action, startStop) {
        switch (action) {
            case HSS_ACTIONS.FIND:
                if (startStop === StartStop.Start)
                    return this.startFindingHSS(source);
                else if (startStop === StartStop.Stop)
                    return this.stopFindingHSS(source);
                break;
            case HSS_ACTIONS.SHOW:
                if (startStop === StartStop.Start)
                    return this.show(source);
                else if (startStop === StartStop.Stop)
                    return this.hide(source);
                break;
            default:
                return { status: CustomCommandStatus.Failure, message: 'commands.hss.invalidaction' };
        }
        return { status: CustomCommandStatus.Success, message: 'commands.hss.invalidaction' };
    }

    startFindingHSS(source) {
        const finder = this.hssFinders[source];
        if (finder)
            return { status: CustomCommandStatus.Failure, message: 'commands.hss.alreadyfinding' };
        system.run(() => {
            this.hssFinders[source] = new HSSFinder(source);
        });
        return { status: CustomCommandStatus.Success, message: 'commands.hss.findingstarted' };
    }

    stopFindingHSS(source) {
        const finder = this.hssFinders[source];
        if (!finder)
            return { status: CustomCommandStatus.Failure, message: 'commands.hss.notfinding' };
        system.run(() => {
            finder.destroy();
            delete this.hssFinders[source];
        });
        return { status: CustomCommandStatus.Success, message: 'commands.hss.findingstopped' };
    }

    show(source) {
        // Logic to show HSS
    }

    hide(source) {
        // Logic to hide HSS
    }
}

export const hssCommand = new HSS();