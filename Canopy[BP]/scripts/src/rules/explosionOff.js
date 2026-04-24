import { BooleanRule, Rules } from "../../lib/canopy/Canopy";
import { world } from "@minecraft/server";

new BooleanRule({
    category: 'Rules',
    identifier: 'explosionOff',
    description: { translate: 'rules.explosionOff' },
    independentRules: ['explosionChainReactionOnly', 'explosionNoBlockDamage'],
    wikiDescription: 'Enables/disables all explosions.'
});

world.beforeEvents.explosion.subscribe((event) => {
    if (!Rules.getNativeValue('explosionOff')) return;
    event.cancel = true;
});