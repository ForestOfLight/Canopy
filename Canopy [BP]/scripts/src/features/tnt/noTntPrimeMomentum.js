import * as mc from '@minecraft/server'

mc.world.afterEvents.entitySpawn.subscribe((event) => {
    if (!mc.world.getDynamicProperty('noTntPrimeMomentum')) return;
    const entity = event.entity;
    if (entity.typeId === 'minecraft:tnt') {
        entity.clearVelocity();
    }
});
