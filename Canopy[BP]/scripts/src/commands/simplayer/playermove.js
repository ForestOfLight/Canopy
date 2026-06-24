import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus, Entity, system } from "@minecraft/server";
import { VanillaCommand, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../../../lib/canopy/Canopy";
import Understudies from "../../classes/simplayer/Understudies";
import { Vector } from "../../../lib/Vector";

export const MOVE_OPTIONS = Object.freeze({
    FORWARD: 'forward', BACKWARD: 'backward', LEFT: 'left', RIGHT: 'right',
    BLOCK: 'block', ENTITY: 'entity', ME: 'me', TO: 'to', STOP: 'stop'
});

new VanillaCommand({
    name: 'canopy:playermove',
    description: 'commands.playermove',
    enums: [{ name: 'canopy:simplayerMoveOption', values: Object.values(MOVE_OPTIONS) }],
    mandatoryParameters: [{ name: 'playername', type: CustomCommandParamType.String }],
    optionalParameters: [
        { name: 'canopy:simplayerMoveOption', type: CustomCommandParamType.Enum },
        { name: 'location', type: CustomCommandParamType.Location }
    ],
    permissionLevel: CommandPermissionLevel.Any,
    allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin],
    callback: (origin, playername, moveOption, location) => {
        const understudy = Understudies.get(playername);
        if (!understudy)
            return { status: CustomCommandStatus.Failure, message: Understudies.getNotOnlineMessage(playername) };
        switch (moveOption) {
            case MOVE_OPTIONS.FORWARD: case MOVE_OPTIONS.BACKWARD:
            case MOVE_OPTIONS.LEFT: case MOVE_OPTIONS.RIGHT:
                system.run(() => understudy.moveRelative(moveOption));
                break;
            case MOVE_OPTIONS.BLOCK: {
                const source = origin.getSource();
                if (source instanceof Entity === false)
                    return { status: CustomCommandStatus.Failure, message: '§cMoving to a block may only be used by entities.' };
                const block = source.getBlockFromViewDirection({ maxDistance: 16*64 })?.block;
                if (block === void 0)
                    return { status: CustomCommandStatus.Failure, message: '§cNo block in view.' };
                system.run(() => understudy.moveLocation(block));
                break;
            }
            case MOVE_OPTIONS.ENTITY: {
                const source = origin.getSource();
                if (source instanceof Entity === false)
                    return { status: CustomCommandStatus.Failure, message: '§cMoving to an entity may only be used by entities.' };
                const entity = source.getEntitiesFromViewDirection({ maxDistance: 16*64 })[0]?.entity;
                if (entity === void 0)
                    return { status: CustomCommandStatus.Failure, message: '§cNo entity in view.' };
                system.run(() => understudy.moveLocation(entity));
                break;
            }
            case MOVE_OPTIONS.ME:
                if (origin instanceof ServerCommandOrigin)
                    return { status: CustomCommandStatus.Failure, message: '§cMoving to yourself cannot be used by the server.' };
                system.run(() => understudy.moveLocation(origin.getSource()));
                break;
            case MOVE_OPTIONS.TO:
                system.run(() => understudy.moveLocation(Vector.from(location)));
                break;
            case MOVE_OPTIONS.STOP:
                system.run(() => understudy.stopMoving());
                break;
            default:
                return { status: CustomCommandStatus.Failure, message: `§cInvalid move option: '${moveOption}'` };
        }
        return { status: CustomCommandStatus.Success };
    }
});
