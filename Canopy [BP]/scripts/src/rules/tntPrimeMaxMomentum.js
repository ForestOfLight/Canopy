import { Rule, Rules } from "lib/canopy/Canopy";
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
    if (Rules.getNativeValue('dupeTnt')) {
        system.runTimeout(() => {
            if (!entity.isValid()) return;
            haltHorizontalVelocity(entity);
            applyHardcodedImpulse(entity);
        }, 1);
    } else {
        negateXZVelocity(entity);
        applyHardcodedImpulse(entity);
    }
});

function haltHorizontalVelocity(entity) {
    const velocity = entity.getVelocity();
    centerEntityPosition(entity); // Entity could be off-center, resulting in a non-straight drop
    entity.applyImpulse({ x: 0, y: velocity.y, z: 0 });
}

function centerEntityPosition(entity) {
    const blockCenter = getHorizontalCenter(entity.location);
    entity.teleport(blockCenter);
}

function getHorizontalCenter(location) {
    const halfABlock = 0.5;
    return { x: Math.floor(location.x) + halfABlock, y: location.y, z: Math.floor(location.z) + halfABlock };
}

function negateXZVelocity(entity) {
    const velocity = entity.getVelocity();
    entity.applyImpulse({ x: -velocity.x, y: 0, z: -velocity.z });
}

function applyHardcodedImpulse(entity) {
    const randX = getRandomMaxMomentumValue();
    const randZ = getRandomMaxMomentumValue();
    entity.applyImpulse({ x: randX, y: 0,  z: randZ });
}

function getRandomMaxMomentumValue() {
    const randValues = [-MAX_VELOCITY, 0, MAX_VELOCITY];
    const randIndex = Math.floor(Math.random() * randValues.length);
    const randValue = randValues[randIndex];
    return randValue;
}

export { negateXZVelocity, haltHorizontalVelocity }