import { Rule } from 'lib/canopy/Canopy';
import { world, system } from '@minecraft/server';
import { negateXZVelocity, correctErrorAndNegateXZVelocity } from './tntPrimeMaxMomentum.js';

new Rule({
    category: 'Rules',
    identifier: 'tntPrimeNoMomentum',
    description: 'TNT does not recieve any momentum when primed.',
    independentRules: ['tntPrimeMaxMomentum'],
});

world.afterEvents.entitySpawn.subscribe(async (event) => {
    if (event.entity.typeId !== 'minecraft:tnt' || !await Rule.getValue('tntPrimeNoMomentum')) return;
    const entity = event.entity;
    if (await Rule.getValue('dupeTnt')) {
        system.runTimeout(() => {
            correctErrorAndNegateXZVelocity(entity);
        }, 1);
    } else {
        negateXZVelocity(entity);
    }
});
