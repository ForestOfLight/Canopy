import { Rule, Rules } from '../../lib/canopy/Canopy';
import { system, world } from '@minecraft/server';

new Rule({
    category: 'Rules',
    identifier: 'dupeTnt',
    description: { translate: 'rules.dupeTnt' },
});

export let spawnedEntitiesThisTick = [];

system.runInterval(() => {
    system.runTimeout(() => {
        spawnedEntitiesThisTick = [];
    }, 0);
}, 1);

world.afterEvents.entitySpawn.subscribe((event) => {
	if (event.entity.typeId !== 'minecraft:tnt' || !Rules.getNativeValue('dupeTnt')) return;
    const entity = event.entity;
    spawnedEntitiesThisTick.push(entity);
});

world.afterEvents.pistonActivate.subscribe((event) => {
    if (!Rules.getNativeValue('dupeTnt')) return;
    const block = event.block;
    const direction = block.permutation.getState('facing_direction');
    let pistonState;
    try {
        pistonState = event.piston.state;
    } catch {
        return 'Piston was removed';
    }
    const attachedLocations = getAttachedLocationAfterMovement(event.piston.getAttachedBlocksLocations(), pistonState, direction);
    system.runTimeout(() => {
        handleTntDuplication(attachedLocations, event);
    }, 4);
});

function getAttachedLocationAfterMovement(attachedLocations, pistonState, direction) {
    const directionToOffsetExpandMap = {
        0: { x: 0, y: -1, z: 0 },
        1: { x: 0, y: 1, z: 0 },
        2: { x: 0, y: 0, z: 1 },
        3: { x: 0, y: 0, z: -1 },
        4: { x: 1, y: 0, z: 0 },
        5: { x: -1, y: 0, z: 0 }
    };
    let offset = directionToOffsetExpandMap[direction];
    if (pistonState === 'Retracting')
        offset = { x: -offset.x, y: -offset.y, z: -offset.z };
    return attachedLocations.map((location) => ({ x: location.x + offset.x, y: location.y + offset.y, z: location.z + offset.z }));
}

export function handleTntDuplication(attachedLocations, event) {
    if (isOverlapping(spawnedEntitiesThisTick, attachedLocations)) {
        for (let i = 0; i < attachedLocations.length; i++) {
            const tntBlock = event.dimension.getBlock(attachedLocations[i]);
            const tntEntity = getEntityAtLocation(spawnedEntitiesThisTick, attachedLocations[i]);
            if (tntBlock && tntEntity)
                dupeTnt(tntBlock, tntEntity);
        }
    }
}

function isOverlapping(entityList, locationList) {
    return entityList.some((entity) => locationList.some((location) => Math.floor(entity.location.x) === location.x 
                && Math.floor(entity.location.y) === location.y 
                && Math.floor(entity.location.z) === location.z));
}

function getEntityAtLocation(entityList, location) {
    return entityList.find((entity) => Math.floor(entity.location.x) === location.x 
                                    && Math.floor(entity.location.y) === location.y
                                    && Math.floor(entity.location.z) === location.z);
}

function dupeTnt(block, tntEntity) {
    const adjacentSpaces = [
        { x: 1, y: 0, z: 0 },
        { x: -1, y: 0, z: 0 },
        { x: 0, y: 0, z: 1 },
        { x: 0, y: 0, z: -1 },
        { x: 0, y: 1, z: 0 },
        { x: 0, y: -1, z: 0 }
    ];
    const adjcentBlockIds = adjacentSpaces.map((adjacentSpace) => block.offset(adjacentSpace).typeId);
    if (adjcentBlockIds.includes('minecraft:noteblock')) {
        block.setType('minecraft:tnt');
        const tntVelocity = tntEntity.getVelocity();
        tntEntity.teleport({ x: tntEntity.location.x, y: tntEntity.location.y - 1, z: tntEntity.location.z });
        tntEntity.applyImpulse(tntVelocity);
    }
}