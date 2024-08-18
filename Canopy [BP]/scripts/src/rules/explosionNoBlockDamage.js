import { Rule } from "lib/canopy/Canopy";
import { world } from "@minecraft/server";

new Rule({
    category: 'Rules',
    identifier: 'explosionNoBlockDamage',
    description: 'Makes explosions not affect blocks.',
    independantRules: ['explosionChainReactionOnly']
});

world.beforeEvents.explosion.subscribe(ev => {
    if (!Rule.getValue('explosionNoBlockDamage')) return;
    ev.setImpactedBlocks([]);
});