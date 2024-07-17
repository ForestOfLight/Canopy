import { world } from '@minecraft/server'

world.afterEvents.entitySpawn.subscribe((event) => {
    if (event.entity.typeId !== 'minecraft:minecart' || !world.getDynamicProperty('universalChunkLoading')) return;
    event.entity.triggerEvent('info:tick_tenSeconds');
});
