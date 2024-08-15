import { world, system } from '@minecraft/server'
import { negateXZVelocity, correctErrorAndNegateXZVelocity } from './tntPrimeMaxMomentum.js'

world.afterEvents.entitySpawn.subscribe((event) => {
    if (event.entity.typeId !== 'minecraft:tnt' || !world.getDynamicProperty('tntPrimeNoMomentum')) return;
    const entity = event.entity;
    if (world.getDynamicProperty('dupeTnt')) {
        system.runTimeout(() => {
            correctErrorAndNegateXZVelocity(entity);
        }, 1);
    } else {
        negateXZVelocity(entity);
    }
});
