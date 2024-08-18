import { Rule } from "lib/canopy/Canopy";
import { system, world } from "@minecraft/server";

new Rule({
    category: 'Rules',
    identifier: 'instantTame',
    description: 'Instantly tames animals with their respective food. Does not work in survival mode.',
});

new Rule({
    category: 'Rules',
    identifier: 'instantTameSurvival',
    description: 'Enables instantTame for survival mode.',
    contingentRules: ['instantTame'],
});

world.beforeEvents.playerInteractWithEntity.subscribe(async (event) => {
    if (!await Rule.getValue('instantTame')) return;
    if (!await Rule.getValue('instantTameSurvival') && event.player.getGameMode() === 'survival') return;
    const tameable = event.target.getComponent('tameable');
    if (tameable && isUsingTameItem(tameable.getTameItems, event.itemStack)) {
        system.run(() => {
            try {
                tameable.tame(event.player);
            } catch {} // was already tamed
        });
    }
});

function isUsingTameItem(tameItemStacks, playeritemStack) {
    return tameItemStacks.map(stack => stack.typeId).includes(playeritemStack?.typeId);
}