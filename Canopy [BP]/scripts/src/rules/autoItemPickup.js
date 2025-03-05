import { Rule, Rules } from "../../lib/canopy/Canopy";
import { ItemStack, system, world } from "@minecraft/server";
import { calcDistance } from "../../include/utils";

new Rule({
    category: 'Rules',
    identifier: 'autoItemPickup',
    description: { translate: 'rules.autoItemPickup' },
    contingentRules: ['carefulBreak']
});

new Rule({
    category: 'Rules',
    identifier: 'carefulBreak',
    description: { translate: 'rules.carefulBreak' }
})

let brokenBlockEventsThisTick = [];

system.runInterval(() => {
    brokenBlockEventsThisTick = [];
});

world.afterEvents.playerBreakBlock.subscribe((blockEvent) => {
    if (!shouldPickup(blockEvent.player)) return;
    if (blockEvent.player?.getGameMode() === 'creative') return;
    brokenBlockEventsThisTick.push(blockEvent);
});

function shouldPickup(player) {
    return (Rules.getNativeValue('carefulBreak') && player?.isSneaking)
        || Rules.getNativeValue('autoItemPickup');
}

world.afterEvents.entitySpawn.subscribe((entityEvent) => {
    if (entityEvent.cause !== 'Spawned' || entityEvent.entity?.typeId !== 'minecraft:item') return;
    if (!Rules.getNativeValue('carefulBreak') && !Rules.getNativeValue('autoItemPickup')) return;

    const item = entityEvent.entity;
    let brokenBlockEvent;
    try {
        brokenBlockEvent = brokenBlockEventsThisTick.find(blockEvent => calcDistance(blockEvent.block.location, item.location) < 2);
    } catch {
        // Could not access block or item, ignore
    }
    if (!brokenBlockEvent)
        return;

    const itemStack = item.getComponent('minecraft:item').itemStack;
    const inventory = brokenBlockEvent.player?.getComponent('minecraft:inventory').container;
    if (!itemStack || !inventory)
        return;
    if (canAddItem(inventory, itemStack)) {
        addItem(inventory, itemStack);
        item.remove();
    }
});

function canAddItem(inventory, itemStack) {
    if (inventory.emptySlotsCount !== 0) return true;
    for (let i = 0; i < inventory.size; i++) {
        const slot = inventory.getSlot(i);
        if (itemFitsInPartiallyFilledSlot(slot, itemStack)) return true;
    }
    return false;
}

function itemFitsInPartiallyFilledSlot(slot, itemStack) {
    return slot.hasItem() && slot.isStackableWith(itemStack) && slot.amount + itemStack.amount <= slot.maxAmount;
}

function addItem(inventory, itemStack) {
    const isItemDeposited = partiallyFilledSlotPass(inventory, itemStack);
    if (!isItemDeposited) 
        emptySlotPass(inventory, itemStack);
    
}

function partiallyFilledSlotPass(inventory, itemStack) {
    for (let slotNum = 0; slotNum < inventory.size; slotNum++) {
        const slot = inventory.getSlot(slotNum);
        if (isSlotAvailableForStacking(slot, itemStack)) {
            const remainderAmount = Math.max(0, (slot.amount + itemStack.amount) - slot.maxAmount);
            slot.amount += itemStack.amount - remainderAmount;
            if (remainderAmount > 0) {
                const remainderStack = new ItemStack(itemStack.typeId, remainderAmount);
                addItem(inventory, remainderStack);
            }
            return true;
        }
    }
    return false;
}

function emptySlotPass(inventory, itemStack) {
    for (let slotNum = 0; slotNum < inventory.size; slotNum++) {
        const slot = inventory.getSlot(slotNum);
        if (!slot.hasItem()) {
            slot.setItem(itemStack);
            return true;
        }
    }
    return false;
}

function isSlotAvailableForStacking(slot, itemStack) {
    return slot.hasItem() && slot.isStackableWith(itemStack) && slot.amount !== slot.maxAmount;
}

export default { brokenBlockEventsThisTick }
