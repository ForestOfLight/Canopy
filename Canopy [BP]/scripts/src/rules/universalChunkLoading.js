import { Rule } from 'lib/canopy/Canopy';
import { world } from '@minecraft/server';

new Rule({
    category: 'Rules',
    identifier: 'universalChunkLoading',
    description: { translate: 'rules.universalChunkLoading' },
});

world.afterEvents.entitySpawn.subscribe(async (event) => {
    if (event.entity.typeId !== 'minecraft:minecart' || !await Rule.getValue('universalChunkLoading')) return;
    event.entity.triggerEvent('canopy:tick_tenSeconds');
});
