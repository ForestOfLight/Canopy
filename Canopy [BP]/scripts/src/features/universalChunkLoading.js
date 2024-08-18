import { Rule } from 'lib/canopy/Rule';
import { world } from '@minecraft/server';

new Rule({
    category: 'Rules',
    identifier: 'universalChunkLoading',
    description: 'Makes minecarts tick a 5x5 chunk area around them for 10 seconds after they are spawned.'
});

world.afterEvents.entitySpawn.subscribe((event) => {
    if (event.entity.typeId !== 'minecraft:minecart' || !Rule.getValue('universalChunkLoading')) return;
    event.entity.triggerEvent('canopy:tick_tenSeconds');
});
