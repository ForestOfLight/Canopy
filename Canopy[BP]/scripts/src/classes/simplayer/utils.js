import { Block, Entity, GameMode, Player } from "@minecraft/server";

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

export function swapSlots(invContainer, slotNumber1, slotNumber2) {
    if (!invContainer)
        throw new Error('[Canopy] Inventory container is not available.');
    const slot1 = invContainer.getItem(slotNumber1);
    const slot2 = invContainer.getItem(slotNumber2);
    invContainer.setItem(slotNumber1, slot2);
    invContainer.setItem(slotNumber2, slot1);
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
