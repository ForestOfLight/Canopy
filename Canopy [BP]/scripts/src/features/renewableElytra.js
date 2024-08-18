import { Rule } from "lib/canopy/Canopy";
import { ItemStack, world } from "@minecraft/server";

new Rule({
    category: 'Rules',
    identifier: 'renewableElytra',
    description: 'Phantoms have a 1%% chance to drop an elytra when killed by a shulker bullet.',
});

world.afterEvents.entityDie.subscribe((event) => {
    if (!Rule.getValue('renewableElytra')) return;
    const entity = event.deadEntity;
    if (entity?.typeId === 'minecraft:phantom' && event.damageSource.damagingProjectile?.typeId === 'minecraft:shulker_bullet') {
        if (Math.random() > 0.01) return;
        entity.dimension.spawnItem(new ItemStack('minecraft:elytra', 1), entity.location);
    }
});