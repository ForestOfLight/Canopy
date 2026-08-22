import { Block, Direction, Entity, GameMode, Player } from "@minecraft/server";
import { Vector } from "../../../lib/Vector";

const PLAYER_EYE_HEIGHT = 1.62001002;

export function getLookAtLocation(baseLocation, targetRotation) {
    const extraDistance = 1000;
    const pitch = targetRotation.x;
    const yaw = targetRotation.y + 90;
    const xz = Math.cos(pitch * Math.PI / 180);
    const x = xz * Math.cos(yaw * Math.PI / 180) * extraDistance;
    const y = Math.sin(-pitch * Math.PI / 180) * extraDistance;
    const z = xz * Math.sin(yaw * Math.PI / 180) * extraDistance;
    return { x: baseLocation.x + x, y: baseLocation.y + y + PLAYER_EYE_HEIGHT, z: baseLocation.z + z };
}

export function getLookAtRotation(baseLocation, targetLocation) {
    const x = targetLocation.x - baseLocation.x;
    const y = targetLocation.y - baseLocation.y - PLAYER_EYE_HEIGHT;
    const z = targetLocation.z - baseLocation.z;
    const yaw = Math.atan2(z, x) * 180 / Math.PI - 90;
    const xz = Math.sqrt(x * x + z * z);
    const pitch = -Math.atan2(y, xz) * 180 / Math.PI;
    return { x: pitch, y: yaw };
}

export function portOldGameModeToNewUpdate(gameMode) {
    if (typeof gameMode === 'string') {
        switch (gameMode.toLowerCase()) {
            case 'survival': return GameMode.Survival;
            case 'creative': return GameMode.Creative;
            case 'adventure': return GameMode.Adventure;
            case 'spectator': return GameMode.Spectator;
            default: throw new Error(`[Canopy] Unknown game mode: ${gameMode}`);
        }
    }
    throw new Error(`[Canopy] Game mode must be a string, received: ${typeof gameMode}`);
}

export function getLocationInfoFromSource(source) {
    if (source instanceof Block)
        return { location: { x: source.x + .5, y: source.y + 1, z: source.z + .5 }, dimension: source.dimension };
    else if (source instanceof Player)
        return { location: source.location, dimension: source.dimension, rotation: source.getRotation(), gameMode: source.getGameMode() };
    else if (source instanceof Entity)
        return { location: source.location, dimension: source.dimension, rotation: source.getRotation() };
    throw new Error(`[Canopy] Invalid source`);
}

export function getBlockFaceLocationFromRaycastHit(raycastHit) {
    const location = Vector.from(raycastHit.block.location).add(raycastHit.faceLocation);
    if (raycastHit.face === Direction.Up)
        location.y += 1;
    else if (raycastHit.face === Direction.East)
        location.x += 1;
    else if (raycastHit.face === Direction.South)
        location.z += 1;
    return location;
}
