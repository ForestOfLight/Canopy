import { Rule, Rules } from "../../lib/canopy/Canopy";
import { system, world } from "@minecraft/server";

new Rule({
    category: 'Rules',
    identifier: 'creativeInstantTame',
    description: { translate: 'rules.creativeInstantTame' }
});


world.beforeEvents.playerInteractWithEntity.subscribe((event) => {
    if (!Rules.getNativeValue('creativeInstantTame') || event.player?.getGameMode() !== 'creative') return;
    const tameable = event.target?.getComponent('tameable');
    if (tameable !== undefined && isUsingTameItem(tameable.getTameItems, event.itemStack)) {
        system.run(() => {
            try {
                tameable.tame(event.player);
            } catch {
                // was already tamed
            }
        });
    }
});

function isUsingTameItem(tameItemStacks, playeritemStack) {
    return tameItemStacks.map(stack => stack.typeId).includes(playeritemStack?.typeId);
}
