import { Rule } from "lib/canopy/Canopy";
import { world } from "@minecraft/server";

new Rule({
    category: 'Rules',
    identifier: 'entityInstantDeath',
    description: 'Removes the 20gt death animation. Entities will also not drop xp.',
});

world.afterEvents.entityDie.subscribe(async (event) => {
    if (!await Rule.getNativeValue('entityInstantDeath')) return;
    try {
        event.deadEntity.remove();
    } catch {} // already dead
});