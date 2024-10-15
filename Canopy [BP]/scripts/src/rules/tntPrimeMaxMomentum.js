import { Rule } from "lib/canopy/Canopy";
import { world, system } from '@minecraft/server';

new Rule({
    category: 'Rules',
    identifier: 'tntPrimeMaxMomentum',
    description: { translate: 'rules.tntPrimeMaxMomentum' },
    independentRules: ['tntPrimeNoMomentum'],
});

const MAX_VELOCITY = 0.019600000232548116; // From vanilla TNT: 49/2500 with some floating point error

world.afterEvents.entitySpawn.subscribe(async (event) => {
    if (event.entity.typeId !== 'minecraft:tnt' || !await Rule.getValue('tntPrimeMaxMomentum')) return;
    const entity = event.entity;
    if (await Rule.getValue('dupeTnt')) {
        system.runTimeout(() => {
            if (!entity.isValid()) return;
            correctErrorAndNegateXZVelocity(entity);
            applyHardcodedImpulse(entity);
        }, 1);
    } else {
        negateXZVelocity(entity);
        applyHardcodedImpulse(entity);
    }
});

function correctErrorAndNegateXZVelocity(entity) {
    const velocity = entity.getVelocity();
    const blockCenter = { x: Math.floor(entity.location.x) + 0.5, y: entity.location.y, z: Math.floor(entity.location.z) + 0.5 };
    entity.teleport(blockCenter);
    entity.applyImpulse({ x: 0, y: velocity.y, z: 0 });
}

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

export { negateXZVelocity, correctErrorAndNegateXZVelocity }