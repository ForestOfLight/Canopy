import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus, Entity, system } from "@minecraft/server";
import { VanillaCommand, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../../../lib/canopy/Canopy";
import Understudies from "../../classes/simplayer/Understudies";
import { Vector } from "../../../lib/Vector";

export const MOVE_OPTIONS = Object.freeze({
    FORWARD: 'forward', BACKWARD: 'backward', LEFT: 'left', RIGHT: 'right',
    BLOCK: 'block', ENTITY: 'entity', ME: 'me', TO: 'to', STOP: 'stop'
});

export class PlayerMoveCommand extends VanillaCommand {
    constructor() {
        super({
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
            callback: (origin, ...args) => this.playermoveCommand(origin, ...args),
            wikiDescription: "Make the simulated player with the given name move in the specified direction or (navigate) to the specified location. This command uses Minecraft's normal pathfinding system, so the simulated player won't be able to navigate very far very far at once.\n\n" +
                "Move Options:  \n" +
                "- `forward`, `backward`, `left`, `right` will make the simulated player move continuously relative to the direction they are facing.\n" +
                "- `block` and `entity` will make the simulated player move towards the block or entity you are looking at.\n" +
                "- `me` will make the simulated player move towards you.\n" +
                "- `to <location: x y z>` will make the simulated player move towards the specified coordinates.\n" +
                "- `stop` will make the simulated player stop moving."
        });
    }

    playermoveCommand(origin, playername, moveOption, location) {
        const understudy = Understudies.get(playername);
        if (!understudy) {
            origin.sendMessage(Understudies.getNotOnlineMessage(playername));
            return;
        }
        switch (moveOption) {
            case MOVE_OPTIONS.FORWARD: case MOVE_OPTIONS.BACKWARD:
            case MOVE_OPTIONS.LEFT: case MOVE_OPTIONS.RIGHT:
                this.#moveRelatively(understudy, moveOption);
                break;
            case MOVE_OPTIONS.BLOCK:
                return this.#moveToBlock(origin, understudy);
            case MOVE_OPTIONS.ENTITY:
                return this.#moveToEntity(origin, understudy);
            case MOVE_OPTIONS.ME:
                return this.#moveToMe(origin, understudy);
            case MOVE_OPTIONS.TO:
                this.#moveToLocation(understudy, location);
                break;
            case MOVE_OPTIONS.STOP:
                this.#stopMoving(understudy);
                break;
            default:
                origin.sendMessage({ translate: 'commands.playermove.invalidoption', with: [moveOption] });
                return;
        }
        return { status: CustomCommandStatus.Success };
    }

    #moveRelatively(understudy, moveOption) {
        system.run(() => understudy.moveRelative(moveOption));
    }

    #moveToBlock(origin, understudy) {
        const source = origin.getSource();
        if (source instanceof Entity === false)
            return { status: CustomCommandStatus.Failure, message: 'commands.playermove.block.entityonly' };
        const block = source.getBlockFromViewDirection({ maxDistance: 16*64 })?.block;
        if (block === void 0)
            return { status: CustomCommandStatus.Failure, message: 'commands.playermove.block.noblock' };
        system.run(() => understudy.moveLocation(block));
        return { status: CustomCommandStatus.Success };
    }

    #moveToEntity(origin, understudy) {
        const source = origin.getSource();
        if (source instanceof Entity === false)
            return { status: CustomCommandStatus.Failure, message: 'commands.playermove.entity.entityonly' };
        const entity = source.getEntitiesFromViewDirection({ maxDistance: 16*64 })[0]?.entity;
        if (entity === void 0)
            return { status: CustomCommandStatus.Failure, message: 'commands.playermove.entity.noentity' };
        system.run(() => understudy.moveLocation(entity));
        return { status: CustomCommandStatus.Success };
    }

    #moveToMe(origin, understudy) {
        if (origin instanceof ServerCommandOrigin)
            return { status: CustomCommandStatus.Failure, message: 'commands.playermove.me.noserver' };
        system.run(() => understudy.moveLocation(origin.getSource()));
        return { status: CustomCommandStatus.Success };
    }

    #moveToLocation(understudy, location) {
        system.run(() => understudy.moveLocation(Vector.from(location)));
    }

    #stopMoving(understudy) {
        system.run(() => understudy.stopMoving());
    }
}

export const playermoveCommand = new PlayerMoveCommand();
