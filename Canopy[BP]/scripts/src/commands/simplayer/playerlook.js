import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus, Entity, system } from "@minecraft/server";
import { VanillaCommand, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../../../lib/canopy/Canopy";
import Understudies from "../../classes/simplayer/Understudies";
import { CARDINAL_ROTATIONS, getViewedBlockFaceLocation, getViewedEntity } from "../../classes/simplayer/targeting";

export { CARDINAL_ROTATIONS };

export const LOOK_OPTIONS = Object.freeze({
    UP: 'up', DOWN: 'down', NORTH: 'north', SOUTH: 'south',
    EAST: 'east', WEST: 'west', BLOCK: 'block', ENTITY: 'entity',
    ME: 'me', AT: 'at', ROTATION: 'rotation', STOP: 'stop'
});

export class PlayerLookCommand extends VanillaCommand {
    constructor() {
        super({
            name: 'canopy:playerlook',
            description: 'commands.playerlook',
            enums: [{ name: 'canopy:simplayerLookOption', values: Object.values(LOOK_OPTIONS) }],
            mandatoryParameters: [{ name: 'playername', type: CustomCommandParamType.String }],
            optionalParameters: [
                { name: 'canopy:simplayerLookOption', type: CustomCommandParamType.Enum },
                { name: 'x', type: CustomCommandParamType.Float },
                { name: 'y', type: CustomCommandParamType.Float },
                { name: 'z', type: CustomCommandParamType.Float }
            ],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin],
            callback: (origin, ...args) => this.playerlookCommand(origin, ...args),
            wikiDescription: "Make the simulated player with the given name look at the specified target.\n\n" +
                "Look Options:  \n" +
                "- `up`, `down`, `north`, `south`, `east`, `west` will make the simulated player look in different cardinal directions.\n" +
                "- `block` and `entity` will make the simulated player look at the block or entity you are looking at.\n" +
                "- `me` will make the simulated player look at you.\n" +
                "- `at <x y z>` will make the simulated player look at the specified coordinates. This does not support relative coordinates.\n" +
                "- `rotation <x y>` will make the simulated player look in the specified rotation.\n" +
                "- `stop` will make the simulated player stop looking at anything."
        });
    }

    playerlookCommand(origin, playername, lookOption, x, y, z) {
        const location = { x, y, z };
        const understudy = Understudies.get(playername);
        if (!understudy) {
            origin.sendMessage(Understudies.getNotOnlineMessage(playername));
            return;
        }
        switch (lookOption) {
            case LOOK_OPTIONS.UP: case LOOK_OPTIONS.DOWN: case LOOK_OPTIONS.NORTH:
            case LOOK_OPTIONS.SOUTH: case LOOK_OPTIONS.EAST: case LOOK_OPTIONS.WEST:
                this.#lookAtCardinal(understudy, lookOption);
                break;
            case LOOK_OPTIONS.BLOCK:
                return this.#lookAtBlock(origin, understudy);
            case LOOK_OPTIONS.ENTITY:
                return this.#lookAtEntity(origin, understudy);
            case LOOK_OPTIONS.ME:
                return this.#lookAtMe(origin, understudy);
            case LOOK_OPTIONS.AT:
                if (x === void 0 || y === void 0 || z === void 0)
                    return { status: CustomCommandStatus.Failure, message: 'commands.playerlook.at.missing' };
                this.#lookAtLocation(understudy, location);
                break;
            case LOOK_OPTIONS.ROTATION:
                if (x === void 0 || y === void 0)
                    return { status: CustomCommandStatus.Failure, message: 'commands.playerlook.rotation.missing' };
                this.#lookRotation(understudy, { x: location.x, y: location.y });
                break;
            case LOOK_OPTIONS.STOP:
                this.#stopLooking(understudy);
                break;
            default:
                origin.sendMessage({ translate: 'commands.playerlook.invalidoption', with: [lookOption] });
                return;
        }
        return { status: CustomCommandStatus.Success };
    }

    #lookAtCardinal(understudy, direction) {
        this.#addLook(understudy, { kind: 'cardinal', direction });
    }

    #lookAtBlock(origin, understudy) {
        const source = origin.getSource();
        if (source instanceof Entity === false)
            return { status: CustomCommandStatus.Failure, message: 'commands.playerlook.block.entityonly' };
        const location = getViewedBlockFaceLocation(source);
        if (location === void 0)
            return { status: CustomCommandStatus.Failure, message: 'commands.playerlook.block.noblock' };
        this.#addLook(understudy, { kind: 'location', location });
        return { status: CustomCommandStatus.Success };
    }

    #lookAtEntity(origin, understudy) {
        const source = origin.getSource();
        if (source instanceof Entity === false)
            return { status: CustomCommandStatus.Failure, message: 'commands.playerlook.entity.entityonly' };
        const entity = getViewedEntity(source);
        if (entity === void 0)
            return { status: CustomCommandStatus.Failure, message: 'commands.playerlook.entity.noentity' };
        this.#addLook(understudy, { kind: 'entity', entity });
        return { status: CustomCommandStatus.Success };
    }

    #lookAtMe(origin, understudy) {
        if (origin instanceof ServerCommandOrigin)
            return { status: CustomCommandStatus.Failure, message: 'commands.playerlook.me.noserver' };
        this.#addLook(understudy, { kind: 'entity', entity: origin.getSource() });
        return { status: CustomCommandStatus.Success };
    }

    #lookAtLocation(understudy, location) {
        this.#addLook(understudy, { kind: 'location', location });
    }

    #lookRotation(understudy, rotation) {
        this.#addLook(understudy, { kind: 'rotation', rotation });
    }

    #stopLooking(understudy) {
        understudy.actions.timeline.removeType('look');
        system.run(() => understudy.stopLooking());
    }

    #addLook(understudy, target) {
        understudy.actions.timeline.addOneShot('look', { target }, { delay: 0 });
    }
}

export const playerlookCommand = new PlayerLookCommand();
