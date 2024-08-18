import { Rule } from "lib/canopy/Canopy";
import { world } from "@minecraft/server";

new Rule({
    category: 'Rules',
    identifier: 'explosionNoBlockDamage',
    description: 'Makes explosions not affect blocks.',
    independentRules: ['explosionChainReactionOnly', 'explosionOff']
});

world.beforeEvents.explosion.subscribe((event) => {
    if (!Rule.getNativeValue('explosionNoBlockDamage')) return;
    event.setImpactedBlocks([]);
});