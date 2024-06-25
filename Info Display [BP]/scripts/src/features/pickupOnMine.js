import * as mc from '@minecraft/server'
import Utils from 'stickycore/utils'

let brokenBlockEvents = [];

mc.system.runInterval(() => {
    brokenBlockEvents = [];
});

mc.world.afterEvents.playerBreakBlock.subscribe(blockEvent => {
    if (blockEvent.player.getGameMode() === 'creative' || !mc.world.getDynamicProperty('pickupOnMine')) return;
    brokenBlockEvents.push(blockEvent);
});

mc.world.afterEvents.entitySpawn.subscribe(entityEvent => {
    if (entityEvent.cause !== 'Spawned' || entityEvent.entity.typeId !== 'minecraft:item') return;
    if (!mc.world.getDynamicProperty('pickupOnMine')) return;

    const item = entityEvent.entity;
    const brokenBlockEvent = brokenBlockEvents.find(blockEvent => Utils.calcDistance(blockEvent.block.location, item.location) < 2);
    if (!brokenBlockEvent) return;

    const itemStack = item.getComponent('minecraft:item').itemStack;
    const inventory = brokenBlockEvent.player.getComponent('minecraft:inventory').container;
    if (canAdd(inventory, itemStack)) {
        inventory.addItem(itemStack)
        item.remove();
    }
});

function canAdd(inventory, itemStack) {
    return (inventory.emptySlotsCount !== 0) || inventory.some(slot => slot.hasItem() && slot.isStackableWith(itemStack));
}
