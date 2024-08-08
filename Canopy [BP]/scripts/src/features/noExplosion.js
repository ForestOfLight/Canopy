import { world } from "@minecraft/server";

world.beforeEvents.explosion.subscribe((event) => {
    if (!world.getDynamicProperty('noExplosion')) return;
    event.cancel = true;
});