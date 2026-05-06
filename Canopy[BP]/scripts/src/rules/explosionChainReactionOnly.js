import { BooleanRule, Rules } from "../../lib/canopy/Canopy";
import { world } from "@minecraft/server";

new BooleanRule({
    category: 'Rules',
    identifier: 'explosionChainReactionOnly',
    description: { translate: 'rules.explosionChainReactionOnly' },
    independentRules: ['explosionNoBlockDamage', 'explosionOff'],
    wikiDescription: 'When enabled, explosions only affect TNT blocks, resulting in chain reactions but no other block damage. Cannot be enabled at the same time as `explosionNoBlockDamage` or `explosionOff`.'
});

world.beforeEvents.explosion.subscribe((event) => {
    if (!Rules.getNativeValue('explosionChainReactionOnly')) return;
    const explodedTntBlocks = event.getImpactedBlocks().filter(block => block.typeId === 'minecraft:tnt');
    event.setImpactedBlocks(explodedTntBlocks);
});