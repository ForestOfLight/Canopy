import { world } from "@minecraft/server";

world.beforeEvents.explosion.subscribe((event) => {
    if (!world.getDynamicProperty('explosionChainReactionOnly')) return;
    const explodedTntBlocks = event.getImpactedBlocks().filter(block => block.typeId === 'minecraft:tnt');
    event.setImpactedBlocks(explodedTntBlocks);
});