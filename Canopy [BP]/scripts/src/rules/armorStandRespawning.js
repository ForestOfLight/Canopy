import { Rule } from "lib/canopy/Canopy";
import { world } from "@minecraft/server";

new Rule({
    category: 'Rules',
    identifier: 'armorStandRespawning',
    description: { translate: 'rules.armorStandRespawning' },
});

world.afterEvents.projectileHitEntity.subscribe(async (event) => {
    if (!await Rule.getValue('armorStandRespawning') || event.projectile.typeId === "minecraft:fishing_hook") return;
    const entity = event.getEntityHit().entity;
    if (entity?.typeId === "minecraft:armor_stand") {
        const hasCleanedItem = cleanDroppedItem(event);
        if (hasCleanedItem) 
            event.dimension.spawnEntity(entity.typeId, event.location);
    }
});

function cleanDroppedItem(event) {
    const nearbyItems = event.dimension.getEntities({ location: event.location, maxDistance: 2, type: "minecraft:item" });
        
    for (const itemEntity of nearbyItems) {
        if (itemEntity?.typeId !== "minecraft:item") continue;
        const itemStack = itemEntity.getComponent("minecraft:item")?.itemStack;
        if (itemStack.typeId === "minecraft:armor_stand" && itemStack.amount === 1) {
            itemEntity.remove();
            return true;
        }
    }
    return false;
}
