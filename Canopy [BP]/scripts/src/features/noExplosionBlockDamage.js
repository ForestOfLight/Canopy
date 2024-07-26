import { world } from "@minecraft/server";

world.beforeEvents.explosion.subscribe(ev => {
    if (world.getDynamicProperty('noExplosionBlockDamage')) ev.setImpactedBlocks([]);
});