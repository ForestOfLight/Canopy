import { Rule, Rules } from 'lib/canopy/Canopy';
import { world, system } from '@minecraft/server';
import { negateXZVelocity, haltHorizontalVelocity } from './tntPrimeMaxMomentum.js';

new Rule({
    category: 'Rules',
    identifier: 'tntPrimeNoMomentum',
    description: { translate: 'rules.tntPrimeNoMomentum' },
    independentRules: ['tntPrimeMaxMomentum'],
});

world.afterEvents.entitySpawn.subscribe(async (event) => {
    if (event.entity.typeId !== 'minecraft:tnt' || !await Rule.getValue('tntPrimeNoMomentum')) return;
    const entity = event.entity;
    if (Rules.getNativeValue('dupeTnt')) {
        system.runTimeout(() => {
            if (!entity.isValid()) return;
            haltHorizontalVelocity(entity);
        }, 1);
    } else {
        negateXZVelocity(entity);
    }
});
