import { world } from "@minecraft/server";

world.afterEvents.entityDie.subscribe((event) => {
    if (!world.getDynamicProperty('entityInstantDeath')) return;
    try {
        event.deadEntity.remove();
    } catch {} // already dead
});