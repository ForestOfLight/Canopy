import { Rule, Rules } from "../../lib/canopy/Canopy";
import { world } from "@minecraft/server";

new Rule({
    category: 'Rules',
    identifier: 'explosionChainReactionOnly',
    description: { translate: 'rules.explosionChainReactionOnly' },
    independentRules: ['explosionNoBlockDamage', 'explosionOff']
});

world.beforeEvents.explosion.subscribe((event) => {
    if (!Rules.getNativeValue('explosionChainReactionOnly')) return;
    const explodedTntBlocks = event.getImpactedBlocks().filter(block => block.typeId === 'minecraft:tnt');
    event.setImpactedBlocks(explodedTntBlocks);
});