import { Rule, Rules } from "../../lib/canopy/Canopy";
import { world } from "@minecraft/server";

new Rule({
    category: 'Rules',
    identifier: 'entityInstantDeath',
    description: { translate: 'rules.entityInstantDeath' },
});

world.afterEvents.entityDie.subscribe(async (event) => {
    if (!await Rules.getNativeValue('entityInstantDeath')) return;
    try {
        event.deadEntity.remove();
    } catch {
        // already dead
    }
});