import { Rule } from 'lib/canopy/Canopy';
import { world, GameMode } from '@minecraft/server';
import { usedDurability, getRemainingDurability } from 'src/rules/durabilityNotifier';

const rule = new Rule({
    category: 'Rules',
    identifier: 'durabilitySwap',
    description: { translate: 'rules.durabilitySwap' },
});

world.afterEvents.playerBreakBlock.subscribe((event) => durabilitySwap(event.player, event.itemStackBeforeBreak, event.itemStackAfterBreak));
world.afterEvents.playerInteractWithBlock.subscribe((event) => durabilitySwap(event.player, event.beforeItemStack, event.itemStack));
world.afterEvents.playerInteractWithEntity.subscribe((event) => durabilitySwap(event.player, event.beforeItemStack, event.itemStack));

function durabilitySwap(player, beforeItemStack, itemStack) {
    if (!Rule.getNativeValue(rule.getID()) || !player || !itemStack || !beforeItemStack
        || player.getGameMode() === GameMode.creative
        || !usedDurability(beforeItemStack, itemStack)
    ) return;
    const durability = getRemainingDurability(itemStack);
    if (durability === 0)
        swapOutItem(player);
}

function swapOutItem(player) {
    const playerInventory = player.getComponent('inventory')?.container;
    if (!playerInventory) return;
    let swapSlot = findEmptySlot(playerInventory);
    if (swapSlot === -1)
        swapSlot = findSlotWithoutDurabilityComponent(playerInventory);
    if (swapSlot === -1)
        swapSlot = findSlotWithSomeDurability(playerInventory);
    if (swapSlot === -1) return;
    playerInventory.swapItems(player.selectedSlotIndex, swapSlot, playerInventory);
}

function findEmptySlot(playerInventory) {
    for (let slotIndex = 9; slotIndex < playerInventory.size; slotIndex++) {
        const slot = playerInventory.getSlot(slotIndex);
        if (!slot.hasItem()) {
            return slotIndex;
        }
    }
    return -1;
}

function findSlotWithoutDurabilityComponent(playerInventory) {
    for (let slotIndex = 0; slotIndex < playerInventory.size; slotIndex++) {
        const slot = playerInventory.getSlot(slotIndex);
        if (slot.hasItem() && !slot.getItem()?.hasComponent('durability')) {
            return slotIndex;
        }
    }
    return -1;
}

function findSlotWithSomeDurability(playerInventory) {
    for (let slotIndex = 0; slotIndex < playerInventory.size; slotIndex++) {
        const slot = playerInventory.getSlot(slotIndex);
        if (slot.hasItem() && getRemainingDurability(slot.getItem()) > 0) {
            return slotIndex;
        }
    }
    return -1;
}