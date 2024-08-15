import { system, world } from "@minecraft/server";

world.beforeEvents.playerInteractWithEntity.subscribe(event => {
    if (!world.getDynamicProperty('instantTame')) return;
    if (!world.getDynamicProperty('instantTameSurvival') && event.player.getGameMode() === 'survival') return;
    const tameable = event.target.getComponent('tameable');
    if (tameable && isUsingTameItem(tameable.getTameItems, event.itemStack)) {
        console.warn('taming', event.target.typeId)
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