import * as mc from '@minecraft/server'

const MAX_VELOCITY = 0.019600000232548116; // 49/2500 with some floating point error (from vanilla TNT)

mc.world.afterEvents.entitySpawn.subscribe((event) => {
    if (!mc.world.getDynamicProperty('hardcodedTntPrimeMomentum')) return;
    const entity = event.entity;
    if (entity.typeId === 'minecraft:tnt') {
        negateXZVelocity(entity);
        applyHardcodedImpulse(entity);
    }
});

function negateXZVelocity(entity) {
    const velocity = entity.getVelocity();
    entity.applyImpulse({ x: -velocity.x, y: 0, z: -velocity.z });
}

function applyHardcodedImpulse(entity) {
    const randValues = [-MAX_VELOCITY, 0, MAX_VELOCITY];
    const randX = randValues[Math.floor(Math.random() * 3)];
    const randZ = randValues[Math.floor(Math.random() * 3)];
    entity.applyImpulse({ x: randX, y: 0,  z: randZ });
}
