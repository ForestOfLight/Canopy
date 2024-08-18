import { Rule } from "lib/canopy/Canopy";
import { world } from "@minecraft/server";

new Rule({
    category: 'Rules',
    identifier: 'explosionOff',
    description: 'Disables explosions entirely.',
});

world.beforeEvents.explosion.subscribe((event) => {
    if (!Rule.getValue('explosionOff')) return;
    event.cancel = true;
});