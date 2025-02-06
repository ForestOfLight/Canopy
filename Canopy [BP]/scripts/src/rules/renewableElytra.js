import { Rule, Rules } from "lib/canopy/Canopy";
import { ItemStack, world } from "@minecraft/server";

const DROP_CHANCE = 0.01;

new Rule({
    category: 'Rules',
    identifier: 'renewableElytra',
    description: { translate: 'rules.renewableElytra' },
});

world.afterEvents.entityDie.subscribe((event) => {
    if (!Rules.getNativeValue('renewableElytra')) return;
    const entity = event.deadEntity;
    if (entity?.typeId === 'minecraft:phantom' && event.damageSource.damagingProjectile?.typeId === 'minecraft:shulker_bullet') {
        if (Math.random() > DROP_CHANCE) return;
        entity.dimension.spawnItem(new ItemStack('minecraft:elytra', 1), entity.location);
    }
});