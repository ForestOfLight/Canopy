import { world, system } from '@minecraft/server'
import { negateXZVelocity, correctErrorAndNegateXZVelocity } from './hardcodedTntPrimeMomentum.js'

world.afterEvents.entitySpawn.subscribe((event) => {
    if (event.entity.typeId !== 'minecraft:tnt' || !world.getDynamicProperty('noTntPrimeMomentum')) return;
    const entity = event.entity;
    if (world.getDynamicProperty('dupeTnt')) {
        system.runTimeout(() => {
            correctErrorAndNegateXZVelocity(entity);
        }, 1);
    } else {
        negateXZVelocity(entity);
    }
});
