import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus } from "@minecraft/server";
import { VanillaCommand, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../../../lib/canopy/Canopy";
import Understudies from "../../classes/simplayer/Understudies";
import { REPEATABLE_ACTIONS } from "../../classes/simplayer/RepeatableAction";

export const TIMING_OPTIONS = Object.freeze({
    ONCE: 'once',
    CONTINUOUS: 'continuous',
    INTERVAL: 'interval',
    AFTER: 'after',
    STOP: 'stop'
});

export class PlayerActionCommand extends VanillaCommand {
    constructor() {
        super({
            name: 'canopy:playeraction',
            description: 'commands.playeraction',
            enums: [
                { name: 'canopy:simplayerAction', values: [ ...Object.values(REPEATABLE_ACTIONS), "stop" ] },
                { name: 'canopy:simplayerTimingOption', values: Object.values(TIMING_OPTIONS) }
            ],
            mandatoryParameters: [
                { name: 'playername', type: CustomCommandParamType.String },
                { name: 'canopy:simplayerAction', type: CustomCommandParamType.Enum }
            ],
            optionalParameters: [
                { name: 'canopy:simplayerTimingOption', type: CustomCommandParamType.Enum },
                { name: 'ticks', type: CustomCommandParamType.Integer }
            ],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin],
            callback: (origin, ...args) => this.playeractionCommand(origin, ...args),
            wikiDescription: "Make the simulated player with the given name perform the specified action.\n\n" +
                "Actions:  \n" +
                "- `attack` will make the simulated player attack the block or entity they are looking at.\n" +
                "- `interact` will make the simulated player interact with the block or entity they are looking at.\n" +
                "- `use` will make the simulated player use the item they are holding.\n" +
                "- `build` will make the simulated player place a block from their inventory at the location they are looking at.\n" +
                "- `break` will make the simulated player break the block they are looking at.\n" +
                "- `drop` will make the simulated player drop one item from their hand.\n" +
                "- `dropstack` will make the simulated player drop the entire stack of items from their hand.\n" +
                "- `dropall` will make the simulated player drop their entire inventory.\n" +
                "- `jump` will make the simulated player jump.\n\n" +
                "Timing Options:  \n" +
                "If no timing option is specified, the simulated player will perform the action once.\n" +
                "- `once` will make the simulated player perform the action once.\n" +
                "- `after` will make the simulated player perform the action after a delay specified by the last argument.\n" +
                "- `continuous` will make the simulated player perform the action continuously.\n" +
                "- `interval` will make the simulated player perform the action at regular intervals specified by the last argument.\n" +
                "- `stop` will make the simulated player stop performing the action."
        });
    }

    playeractionCommand(origin, playername, action, timingOption = TIMING_OPTIONS.ONCE, ticks) {
        const understudy = Understudies.get(playername);
        if (!understudy) {
            origin.sendMessage(Understudies.getNotOnlineMessage(playername));
            return;
        }
        if (!Object.values(REPEATABLE_ACTIONS).includes(action))
            return { status: CustomCommandStatus.Failure, message: `commands.generic.invalidaction` };
        const actions = understudy.actions;
        switch (timingOption) {
            case TIMING_OPTIONS.ONCE:
                actions.once(action);
                break;
            case TIMING_OPTIONS.AFTER:
                return this.#singleAfterAction(origin, actions, action, timingOption, ticks);
            case TIMING_OPTIONS.CONTINUOUS:
                actions.repeat(action);
                break;
            case TIMING_OPTIONS.INTERVAL:
                return this.#intervalAction(origin, actions, action, timingOption, ticks);
            case TIMING_OPTIONS.STOP:
                actions.remove(action);
                break;
            default:
                origin.sendMessage({ translate: 'commands.playeraction.invalidtiming', with: [action, timingOption] });
                return;
        }
        return { status: CustomCommandStatus.Success };
    }

    #singleAfterAction(origin, actions, action, timingOption, ticks) {
        if (ticks === void 0) {
            origin.sendMessage({ translate: 'commands.playeraction.invalidticks', with: [timingOption, String(ticks)] });
            return;
        }
        actions.once(action, ticks);
        return { status: CustomCommandStatus.Success };
    }

    #intervalAction(origin, actions, action, timingOption, ticks) {
        if (ticks === void 0) {
            origin.sendMessage({ translate: 'commands.playeraction.invalidticks', with: [timingOption, String(ticks)] });
            return;
        }
        actions.repeat(action, ticks);
        return { status: CustomCommandStatus.Success };
    }
}

export const playeractionCommand = new PlayerActionCommand();
