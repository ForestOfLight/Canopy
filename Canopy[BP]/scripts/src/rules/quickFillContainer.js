import { BlockComponentTypes, ButtonState, EntityComponentTypes, GameMode, InputButton, system, world } from "@minecraft/server";
import { AbilityRule } from "../../lib/canopy/Canopy";
import { QuickFillClipboardController } from "../classes/quickfill/QuickFillClipboardController";
import { QuickFillContainerPolicy } from "../classes/quickfill/QuickFillContainerPolicy";

class QuickFillContainer extends AbilityRule {
    bannedContainers = ['minecraft:beacon', 'minecraft:jukebox', 'minecraft:lectern'];
    
    constructor() {
        super({
            identifier: 'quickFillContainer',
            wikiDescription: 'With an arrow in the top left of your inventory (slot 9), interact with a container while holding an item to move matching items into it; sneak to reverse. Break a container to copy it to the clipboard, interact to paste, sneak + interact to remove matching clipboard items, and sneak + break to deactivate the clipboard.',
            onEnableCallback: () => {
                world.beforeEvents.playerInteractWithBlock.subscribe(this.onPlayerInteractWithBlockBound);
                world.beforeEvents.playerBreakBlock.subscribe(this.onPlayerBreakBlockBound);
            },
            onDisableCallback: () => {
                world.beforeEvents.playerInteractWithBlock.unsubscribe(this.onPlayerInteractWithBlockBound);
                world.beforeEvents.playerBreakBlock.unsubscribe(this.onPlayerBreakBlockBound);
            }
        }, { slotNumber: 9 });
        this.onPlayerInteractWithBlockBound = this.onPlayerInteractWithBlock.bind(this);
        this.onPlayerBreakBlockBound = this.onPlayerBreakBlock.bind(this);
    }

    onPlayerInteractWithBlock(event) {
        const player = event.player;
        const block = event.block;
        if (!player || !this.isEnabledForPlayer(player) || this.bannedContainers.includes(block?.typeId))
            return;

        const blockInv = block.getComponent(BlockComponentTypes.Inventory)?.container;
        const playerInv = player.getComponent(EntityComponentTypes.Inventory)?.container;
        if (!playerInv || !blockInv)
            return;

        const handItemStack = event.itemStack;
        const clipboard = QuickFillClipboardController.get(player);
        if (!clipboard && (QuickFillContainerPolicy.isClipboardOnly(block) || !handItemStack || !QuickFillContainerPolicy.canInsertItem(block, handItemStack)))
            return;
        event.cancel = true;

        const playerIsSneaking = player.inputInfo.getButtonState(InputButton.Sneak) === ButtonState.Pressed;
        system.run(() => {
            if (clipboard) {
                QuickFillClipboardController.apply(player, block, clipboard, playerIsSneaking);
                return;
            }
            if (playerIsSneaking)
                this.transferToPlayer(player, block, handItemStack);
            else if (player.getGameMode() === GameMode.Creative)
                this.fillCreative(player, block, handItemStack);
            else
                this.transferToContainer(player, block, handItemStack);
        });
    }

    onPlayerBreakBlock(event) {
        const player = event.player;
        const block = event.block;
        if (!player || !this.isEnabledForPlayer(player) || this.bannedContainers.includes(block?.typeId))
            return;
        if (!block.getComponent(BlockComponentTypes.Inventory)?.container)
            return;

        const playerIsSneaking = player.inputInfo.getButtonState(InputButton.Sneak) === ButtonState.Pressed;
        if (playerIsSneaking && !QuickFillClipboardController.get(player))
            return;

        event.cancel = true;
        system.run(() => {
            if (playerIsSneaking) {
                QuickFillClipboardController.deactivate(player);
                return;
            }
            QuickFillClipboardController.copy(player, block);
        });
    }

    fillCreative(player, block, itemStack) {
        const blockInv = block.getComponent(BlockComponentTypes.Inventory)?.container;
        if (!blockInv)
            return;

        let filledSlots = 0;
        for (let slot = 0; slot < blockInv.size; slot++) {
            if (!QuickFillContainerPolicy.canInsertItem(block, itemStack, slot))
                continue;

            const current = blockInv.getItem(slot);
            if (current && !current.isStackableWith(itemStack))
                continue;
            if (current && current.amount >= current.maxAmount)
                continue;

            const maxAmount = current?.maxAmount ?? itemStack.maxAmount;
            const replacement = current?.clone() ?? itemStack.clone();
            replacement.amount = maxAmount;
            try {
                blockInv.setItem(slot, replacement);
                filledSlots++;
            } catch {
                continue;
            }
        }

        const destinationFull = !filledSlots && blockInv.emptySlotsCount === 0;
        this.sendFeedbackMessage(true, player, block, itemStack, filledSlots, destinationFull);
    }

    transferToPlayer(player, block, itemStack) {
        const blockInv = block.getComponent(BlockComponentTypes.Inventory)?.container;
        const playerInv = player.getComponent(EntityComponentTypes.Inventory)?.container;
        if (!blockInv || !playerInv)
            return;
        const changedSlots = this.transferAllItemType(blockInv, playerInv, itemStack.typeId);
        const destinationFull = !changedSlots && playerInv.emptySlotsCount === 0 && this.hasItemType(blockInv, itemStack.typeId);
        this.sendFeedbackMessage(false, player, block, itemStack, changedSlots, destinationFull);
    }

    transferToContainer(player, block, itemStack) {
        const blockInv = block.getComponent(BlockComponentTypes.Inventory)?.container;
        const playerInv = player.getComponent(EntityComponentTypes.Inventory)?.container;
        if (!blockInv || !playerInv)
            return;
        const changedSlots = this.transferAllItemType(playerInv, blockInv, itemStack.typeId, block);
        const destinationFull = !changedSlots && blockInv.emptySlotsCount === 0;
        this.sendFeedbackMessage(true, player, block, itemStack, changedSlots, destinationFull);
    }

    hasItemType(container, itemTypeId) {
        for (let slot = 0; slot < container.size; slot++) {
            if (container.getItem(slot)?.typeId === itemTypeId)
                return true;
        }
        return false;
    }

    transferAllItemType(fromContainer, toContainer, itemTypeId, block) {
        const changedTargetSlots = block ? new Set() : undefined;
        let changedSourceSlots = 0;
        for (let slotIndex = 0; slotIndex < fromContainer.size; slotIndex++) {
            const currFromItem = fromContainer.getItem(slotIndex);
            if (currFromItem?.typeId !== itemTypeId)
                continue;

            const originalAmount = currFromItem.amount;
            const untransferred = block ? this.addItemToBlock(block, toContainer, currFromItem, changedTargetSlots) : toContainer.addItem(currFromItem);
            if (originalAmount === (untransferred?.amount ?? 0))
                continue;

            fromContainer.setItem(slotIndex, untransferred ?? null);
            changedSourceSlots++;
        }
        return block ? changedTargetSlots.size : changedSourceSlots;
    }

    addItemToBlock(block, container, itemStack, changedSlots) {
        let remainingAmount = itemStack.amount;
        for (let slot = 0; slot < container.size && remainingAmount > 0; slot++) {
            if (!QuickFillContainerPolicy.canInsertItem(block, itemStack, slot))
                continue;

            const current = container.getItem(slot);
            if (!current || !current.isStackableWith(itemStack) || current.amount >= current.maxAmount)
                continue;

            const added = Math.min(current.maxAmount - current.amount, remainingAmount);
            const replacement = current.clone();
            replacement.amount += added;
            try {
                container.setItem(slot, replacement);
                changedSlots.add(slot);
                remainingAmount -= added;
            } catch {
                continue;
            }
        }

        for (let slot = 0; slot < container.size && remainingAmount > 0; slot++) {
            if (container.getItem(slot) || !QuickFillContainerPolicy.canInsertItem(block, itemStack, slot))
                continue;

            const replacement = itemStack.clone();
            replacement.amount = Math.min(remainingAmount, itemStack.maxAmount);
            try {
                container.setItem(slot, replacement);
                changedSlots.add(slot);
                remainingAmount -= replacement.amount;
            } catch {
                continue;
            }
        }

        if (remainingAmount === 0)
            return;
        const remaining = itemStack.clone();
        remaining.amount = remainingAmount;
        return remaining;
    }

    sendFeedbackMessage(isFilling, player, block, itemStack, changedSlots, destinationFull = false) {
        if (!changedSlots) {
            if (destinationFull) {
                player.onScreenDisplay.setActionBar(isFilling
                    ? '§7Quick Fill: no available space in container.'
                    : '§7Quick Fill: player inventory is full.');
                return;
            }

            player.onScreenDisplay.setActionBar(`§7Quick Fill: nothing to ${isFilling ? 'fill' : 'remove'}.`);
            return;
        }

        const feedback = { rawtext: [] };
        if (isFilling) {
            feedback.rawtext.push({
                translate: 'rules.quickFillContainer.filled',
                with: { rawtext: [
                    { translate: block.localizationKey },
                    { translate: itemStack.localizationKey }
                ]}
            });
        } else {
            feedback.rawtext.push({
                translate: 'rules.quickFillContainer.taken',
                with: { rawtext: [
                    { translate: itemStack.localizationKey },
                    { translate: block.localizationKey }
                ]}
            });
        }
        const slotText = changedSlots === 1 ? 'slot' : 'slots';
        feedback.rawtext.push({ text: ` (§a${changedSlots}§7 ${slotText})` });
        player.onScreenDisplay.setActionBar(feedback);
    }
}

export const quickFillContainer = new QuickFillContainer();
