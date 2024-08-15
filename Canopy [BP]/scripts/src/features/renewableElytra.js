import { ItemStack, world } from "@minecraft/server";

world.afterEvents.entityDie.subscribe((event) => {
    if (!world.getDynamicProperty('renewableElytra')) return;
    const entity = event.deadEntity;
    if (entity?.typeId === 'minecraft:phantom' && event.damageSource.damagingProjectile?.typeId === 'minecraft:shulker_bullet') {
        if (Math.random() > 0.01) return;
        entity.dimension.spawnItem(new ItemStack('minecraft:elytra', 1), entity.location);
    }
});