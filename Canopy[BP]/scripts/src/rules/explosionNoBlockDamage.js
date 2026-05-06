import { BooleanRule, Rules } from "../../lib/canopy/Canopy";
import { world } from "@minecraft/server";

new BooleanRule({
    category: 'Rules',
    identifier: 'explosionNoBlockDamage',
    description: { translate: 'rules.explosionNoBlockDamage' },
    independentRules: ['explosionChainReactionOnly', 'explosionOff'],
    wikiDescription: 'Enables/disables explosion block damage. Explosions will still damage entities but will not break blocks. Useful for testing TNT-based contraptions in a controlled environment. Cannot be enabled at the same time as `explosionChainReactionOnly` or `explosionOff`.'
});

world.beforeEvents.explosion.subscribe((event) => {
    if (!Rules.getNativeValue('explosionNoBlockDamage')) return;
    event.setImpactedBlocks([]);
});