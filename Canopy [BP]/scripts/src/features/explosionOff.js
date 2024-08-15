import { world } from "@minecraft/server";

world.beforeEvents.explosion.subscribe((event) => {
    if (!world.getDynamicProperty('explosionOff')) return;
    event.cancel = true;
});