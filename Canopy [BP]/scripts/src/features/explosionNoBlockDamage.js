import { world } from "@minecraft/server";

world.beforeEvents.explosion.subscribe(ev => {
    if (!world.getDynamicProperty('explosionNoBlockDamage')) return;
    ev.setImpactedBlocks([]);
});