import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus, Entity, system } from "@minecraft/server";
import { VanillaCommand, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../../../lib/canopy/Canopy";
import Understudies from "../../classes/simplayer/Understudies";
import { Vector } from "../../../lib/Vector";

export const LOOK_OPTIONS = Object.freeze({
    UP: 'up', DOWN: 'down', NORTH: 'north', SOUTH: 'south',
    EAST: 'east', WEST: 'west', BLOCK: 'block', ENTITY: 'entity',
    ME: 'me', AT: 'at', ROTATION: 'rotation', STOP: 'stop'
});

export const CARDINAL_ROTATIONS = {
    up: { x: -90, y: 0 }, down: { x: 90, y: 0 }, north: { x: 0, y: 180 },
    south: { x: 0, y: 0 }, east: { x: 0, y: -90 }, west: { x: 0, y: 90 }
};

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
            callback: (origin, ...args) => this.playerlookCommand(origin, ...args)
        });
    }

    playerlookCommand(origin, playername, lookOption, x, y, z) {
        const location = { x, y, z };
        const understudy = Understudies.get(playername);
        if (!understudy) {
            origin.sendMessage(Understudies.getNotOnlineMessage(playername));
            return { status: CustomCommandStatus.Failure };
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
                return { status: CustomCommandStatus.Failure };
        }
        return { status: CustomCommandStatus.Success };
    }

    #lookAtCardinal(understudy, direction) {
        system.run(() => understudy.look(CARDINAL_ROTATIONS[direction]));
    }

    #lookAtBlock(origin, understudy) {
        const source = origin.getSource();
        if (source instanceof Entity === false)
            return { status: CustomCommandStatus.Failure, message: 'commands.playerlook.block.entityonly' };
        const block = source.getBlockFromViewDirection({ maxDistance: 16*64 })?.block;
        if (block === void 0)
            return { status: CustomCommandStatus.Failure, message: 'commands.playerlook.block.noblock' };
        system.run(() => understudy.look(block));
        return { status: CustomCommandStatus.Success };
    }

    #lookAtEntity(origin, understudy) {
        const source = origin.getSource();
        if (source instanceof Entity === false)
            return { status: CustomCommandStatus.Failure, message: 'commands.playerlook.entity.entityonly' };
        const entity = source.getEntitiesFromViewDirection({ maxDistance: 16*64 })[0]?.entity;
        if (entity === void 0)
            return { status: CustomCommandStatus.Failure, message: 'commands.playerlook.entity.noentity' };
        system.run(() => understudy.look(entity));
        return { status: CustomCommandStatus.Success };
    }

    #lookAtMe(origin, understudy) {
        if (origin instanceof ServerCommandOrigin)
            return { status: CustomCommandStatus.Failure, message: 'commands.playerlook.me.noserver' };
        system.run(() => understudy.look(origin.getSource()));
        return { status: CustomCommandStatus.Success };
    }

    #lookAtLocation(understudy, location) {
        system.run(() => understudy.look(Vector.from(location)));
    }

    #lookRotation(understudy, rotation) {
        system.run(() => understudy.look(rotation));
    }

    #stopLooking(understudy) {
        system.run(() => understudy.stopLooking());
    }
}

export const playerlookCommand = new PlayerLookCommand();
