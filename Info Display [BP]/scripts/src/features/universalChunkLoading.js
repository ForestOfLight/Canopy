import * as mc from '@minecraft/server'

mc.world.afterEvents.entitySpawn.subscribe((event) => {
    if (event.entity.typeId !== 'minecraft:minecart' || !mc.world.getDynamicProperty('universalChunkLoading')) return;
    event.entity.triggerEvent('info:tick_tenSeconds');
});
