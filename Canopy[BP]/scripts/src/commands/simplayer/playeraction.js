import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus } from "@minecraft/server";
import { VanillaCommand, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../../../lib/canopy/Canopy";
import Understudies from "../../classes/simplayer/Understudies";
import { REPEATABLE_ACTIONS, TIMING_OPTIONS } from "../../classes/simplayer/RepeatableAction";

export class PlayerActionCommand extends VanillaCommand {
    constructor() {
        super({
            name: 'canopy:playeraction',
            description: 'commands.playeraction',
            enums: [
                { name: 'canopy:simplayerAction', values: Object.values(REPEATABLE_ACTIONS) },
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
            callback: (origin, ...args) => this.playeractionCommand(origin, ...args)
        });
    }

    playeractionCommand(_origin, playername, action, timingOption = TIMING_OPTIONS.ONCE, ticks) {
        const understudy = Understudies.get(playername);
        if (!understudy)
            return { status: CustomCommandStatus.Failure, message: Understudies.getNotOnlineMessage(playername) };
        const actions = understudy.actions;
        switch (timingOption) {
            case TIMING_OPTIONS.ONCE:
                actions.once(action);
                break;
            case TIMING_OPTIONS.AFTER:
                return this.#singleAfterAction(actions, action, timingOption, ticks);
            case TIMING_OPTIONS.CONTINUOUS:
                actions.repeat(action);
                break;
            case TIMING_OPTIONS.INTERVAL:
                return this.#intervalAction(actions, action, timingOption, ticks);
            case TIMING_OPTIONS.STOP:
                actions.remove(action);
                break;
            default:
                return { status: CustomCommandStatus.Failure, message: `§cInvalid ${action} timing: ${timingOption}.` };
        }
        return { status: CustomCommandStatus.Success };
    }

    #singleAfterAction(actions, action, timingOption, ticks) {
        if (ticks === void 0)
            return { status: CustomCommandStatus.Failure, message: `§cInvalid '${timingOption}' tick duration: ${ticks}. Expected an integer.` };
        actions.once(action, ticks);
        return { status: CustomCommandStatus.Success };
    }

    #intervalAction(actions, action, timingOption, ticks) {
        if (ticks === void 0)
            return { status: CustomCommandStatus.Failure, message: `§cInvalid '${timingOption}' tick duration: ${ticks}. Expected an integer.` };
        actions.repeat(action, ticks);
        return { status: CustomCommandStatus.Success };
    }
}

export const playeractionCommand = new PlayerActionCommand();
