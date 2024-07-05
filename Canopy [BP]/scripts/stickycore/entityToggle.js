import Utils from 'stickycore/utils'
import * as mc from '@minecraft/server';

let tickingEntities = [];

function toggleClosestEntityTicking(player, entityType, maxDistance, enable) {
    let closestEntity = null;
    let closestDistance = maxDistance;
    const entities = player.dimension.getEntities({ type: `minecraft:${entityType}` }).forEach( entity => {
        const distance = Utils.calcDistance(player.location, entity.location);
        if (distance < closestDistance) {
            closestEntity = entity;
            closestDistance = distance;
        }
    });
    if (closestEntity && enable) {
        closestEntity.triggerEvent("info:enable_ticking");
        tickingEntities.push(closestEntity);
        return closestEntity.location;
    } else if (closestEntity && !enable) {
        closestEntity.triggerEvent("info:disable_ticking");
        tickingEntities = tickingEntities.filter( entity => entity !== closestEntity );
        return closestEntity.location;
    } else return undefined;
}

mc.world.beforeEvents.entityRemove.subscribe((ev) => {
    if (tickingEntities.includes(ev.removedEntity)) {
        tickingEntities = tickingEntities.filter( entity => entity !== ev.removedEntity );
    }
});

export { toggleClosestEntityTicking, tickingEntities }