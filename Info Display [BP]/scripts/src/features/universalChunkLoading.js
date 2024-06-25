import * as mc from '@minecraft/server'

mc.world.afterEvents.entitySpawn.subscribe((event) => {
    if (event.entity.typeId !== 'minecraft:minecart' || !mc.world.getDynamicProperty('universalChunkLoading')) return;
    const entity = event.entity;
    entity.triggerEvent('info:enable_ticking');
    mc.system.runTimeout(() => {
        if (entity.isValid()) entity.triggerEvent('info:disable_ticking');
    }, 200);
});