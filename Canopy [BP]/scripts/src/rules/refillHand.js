import { AbilityRule } from "../../lib/canopy/Canopy";
import { EntityComponentTypes, GameMode, world } from "@minecraft/server";

class RefillHand extends AbilityRule {
    constructor() {
        super({
            identifier: 'refillHand',
            onEnableCallback: () => this.subscribeToEvents(),
            onDisableCallback: () => this.unsubscribeFromEvents()
        }, { slotNumber: 10 });
        this.captureEventBound = this.captureEvent.bind(this);
    }

    subscribeToEvents() {
        world.afterEvents.playerInteractWithBlock.subscribe(this.captureEventBound);
        world.afterEvents.playerInteractWithEntity.subscribe(this.captureEventBound);
    }

    unsubscribeFromEvents() {
        world.afterEvents.playerInteractWithBlock.unsubscribe(this.captureEventBound);
        world.afterEvents.playerInteractWithEntity.unsubscribe(this.captureEventBound);
    }

    captureEvent(event) {
        const player = event.player;
        if (!player || !this.isEnabledForPlayer(player) || player.getGameMode() !== GameMode.Survival)
            return;
        this.processRefillHand(player, event.beforeItemStack, event.itemStack);
    }

    processRefillHand(player, beforeItemStack, afterItemStack) {
        if (this.hasRunOutOfItems(beforeItemStack, afterItemStack))
            this.refillHand(player, beforeItemStack);
    }

    refillHand(player, beforeItemStack) {
        const playerInventory = player.getComponent(EntityComponentTypes.Inventory)?.container;
        let minAmount = Infinity;
        let minSlotIndex = -1;
        for (let slotIndex = 0; slotIndex < playerInventory.size; slotIndex++) {
            const slot = playerInventory.getSlot(slotIndex);
            if (slot.hasItem() && slot.isStackableWith(beforeItemStack)) {
                if (slot.amount < minAmount) {
                    minAmount = slot.amount;
                    minSlotIndex = slotIndex;
                }
            }
        }
        if (minSlotIndex !== -1)
            playerInventory.swapItems(minSlotIndex, player.selectedSlotIndex, playerInventory);
    }

    hasRunOutOfItems(beforeItemStack, afterItemStack) {
        return beforeItemStack?.typeId !== afterItemStack?.typeId;
    }
}

export const refillHand = new RefillHand();