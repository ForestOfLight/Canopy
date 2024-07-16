import { system, world } from '@minecraft/server';

let spawnedEntitiesThisTick = [];

system.runInterval(() => {
    system.runTimeout(() => {
        spawnedEntitiesThisTick = [];
    }, 0);
}, 1);

world.afterEvents.entitySpawn.subscribe((event) => {
	if (event.entity.typeId !== 'minecraft:tnt' || !world.getDynamicProperty('dupeTnt')) return;
    const entity = event.entity;
    spawnedEntitiesThisTick.push(entity);
});

world.afterEvents.pistonActivate.subscribe((event) => {
    if (!world.getDynamicProperty('dupeTnt')) return;
    const block = event.block;
    const direction = block.permutation.getState('facing_direction');
    const pistonState = event.piston.state;
    const attachedLocations = correctAttachedLocations(event.piston.getAttachedBlocksLocations(), pistonState, direction);
    system.runTimeout(() => {
        if (isOverlapping(spawnedEntitiesThisTick, attachedLocations)) {
            for (let i = 0; i < attachedLocations.length; i++) {
                const tntBlock = event.dimension.getBlock(attachedLocations[i]);
                const tntEntity = getEntityAtLocation(spawnedEntitiesThisTick, attachedLocations[i]);
                if (tntBlock && tntEntity) dupeTnt(tntBlock, tntEntity);
            }
        }
    }, 4);
});

function correctAttachedLocations(attachedLocations, pistonState, direction) {
    const directionToOffsetExpandMap = {
        0: { x: 0, y: -1, z: 0 },
        1: { x: 0, y: 1, z: 0 },
        2: { x: 0, y: 0, z: 1 },
        3: { x: 0, y: 0, z: -1 },
        4: { x: 1, y: 0, z: 0 },
        5: { x: -1, y: 0, z: 0 }
    };
    let offset = directionToOffsetExpandMap[direction];
    if (pistonState === 'Retracting') offset = { x: -offset.x, y: -offset.y, z: -offset.z };
    return attachedLocations.map((location) => {
        return { x: location.x + offset.x, y: location.y + offset.y, z: location.z + offset.z };
    });
}

function isOverlapping(entityList, locationList) {
    return entityList.some((entity) => {
        return locationList.some((location) => {
            return Math.floor(entity.location.x) === location.x 
                && Math.floor(entity.location.y) === location.y 
                && Math.floor(entity.location.z) === location.z;
        });
    });
}

function getEntityAtLocation(entityList, location) {
    return entityList.find((entity) => {
        return Math.floor(entity.location.x) === location.x && Math.floor(entity.location.y) === location.y && Math.floor(entity.location.z) === location.z;
    });
}

function dupeTnt(block, tntEntity) {
    const adjacentSpaces = [
        { x: 1, y: 0, z: 0 },
        { x: -1, y: 0, z: 0 },
        { x: 0, y: 0, z: 1 },
        { x: 0, y: 0, z: -1 },
        { x: 0, y: 1, z: 0 },
        { x: 0, y: -1, z: 0 }
    ]
    const adjcentBlockIds = adjacentSpaces.map((adjacentSpace) => block.offset(adjacentSpace).typeId);
    if (adjcentBlockIds.includes('minecraft:noteblock')) {
        block.setType('minecraft:tnt');
        const tntVelocity = tntEntity.getVelocity();
        tntEntity.teleport({ x: tntEntity.location.x, y: tntEntity.location.y - 1, z: tntEntity.location.z });
        tntEntity.applyImpulse(tntVelocity);
    }
}