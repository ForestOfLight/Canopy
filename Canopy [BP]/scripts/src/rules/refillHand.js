import { Rule, Rules} from "../../lib/canopy/Canopy";
import { GameMode, world } from "@minecraft/server";

new Rule({
    category: 'Rules',
    identifier: 'refillHand',
    description: { translate: 'rules.refillHand' }
});

const ARROW_SLOT = 10;

world.afterEvents.playerInteractWithBlock.subscribe((event) => captureEvent(event));
world.afterEvents.playerInteractWithEntity.subscribe((event) => captureEvent(event));

function captureEvent(event) {
    if (!Rules.getNativeValue('refillHand')) return;
    const player = event.player;
    if (!player || player.getGameMode() !== GameMode.survival) return;
    processRefillHand(player, event.beforeItemStack, event.itemStack);
}

function processRefillHand(player, beforeItemStack, afterItemStack) {
    const playerInventory = player.getComponent('inventory')?.container;
    if (beforeItemStack === undefined || !hasArrowInCorrectSlot(playerInventory)) return;
    if (hasRunOutOfItems(beforeItemStack, afterItemStack)) 
        refillHand(player, playerInventory, beforeItemStack);
    
}

function hasArrowInCorrectSlot(playerInventory) {
    return playerInventory?.getItem(ARROW_SLOT)?.typeId === 'minecraft:arrow';
}

function hasRunOutOfItems(beforeItemStack, afterItemStack) {
    return beforeItemStack?.typeId !== afterItemStack?.typeId;
}

function refillHand(player, playerInventory, beforeItemStack) {
    for (let slotIndex = 0; slotIndex < playerInventory.size; slotIndex++) {
        const slot = playerInventory.getSlot(slotIndex);
        if (slot.hasItem() && slot.isStackableWith(beforeItemStack)) {
            playerInventory.swapItems(slotIndex, player.selectedSlotIndex, playerInventory);
            return;
        }
    }
}
