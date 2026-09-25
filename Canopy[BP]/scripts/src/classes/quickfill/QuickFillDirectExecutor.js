import { BlockComponentTypes, EntityComponentTypes } from "@minecraft/server";
import { InventoryUtils } from "../InventoryUtils";
import { QuickFillContainerPolicy } from "./QuickFillContainerPolicy";

export class QuickFillDirectExecutor {
    static fillCreative(player, block, itemStack, blockInv = block.getComponent(BlockComponentTypes.Inventory)?.container) {
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

        const destinationFull = !filledSlots && !InventoryUtils.hasAvailableSpace(blockInv, itemStack, slot => QuickFillContainerPolicy.canInsertItem(block, itemStack, slot));
        this.sendFeedbackMessage(true, player, block, itemStack, filledSlots, destinationFull);
    }

    static transferToPlayer(player, block, itemStack, blockInv = block.getComponent(BlockComponentTypes.Inventory)?.container) {
        const playerInv = player.getComponent(EntityComponentTypes.Inventory)?.container;
        if (!blockInv || !playerInv)
            return;
        const changedSlots = this.transferAllItemType(blockInv, playerInv, itemStack.typeId, undefined, block);
        const destinationFull = !changedSlots && playerInv.emptySlotsCount === 0 && InventoryUtils.hasItemType(blockInv, itemStack.typeId, slot => QuickFillContainerPolicy.canUseSlot(block, slot));
        this.sendFeedbackMessage(false, player, block, itemStack, changedSlots, destinationFull);
    }

    static transferAllToPlayer(player, target, targetInv) {
        const playerInv = player.getComponent(EntityComponentTypes.Inventory)?.container;
        if (!targetInv || !playerInv)
            return;

        let changedSlots = 0;
        for (let slot = 0; slot < targetInv.size; slot++) {
            if (!QuickFillContainerPolicy.canUseSlot(target, slot))
                continue;

            const itemStack = targetInv.getItem(slot);
            if (!itemStack)
                continue;

            const originalAmount = itemStack.amount;
            const untransferred = playerInv.addItem(itemStack);
            if (originalAmount === (untransferred?.amount ?? 0))
                continue;

            targetInv.setItem(slot, untransferred ?? null);
            changedSlots++;
        }

        let itemsRemain = false;
        for (let slot = 0; slot < targetInv.size; slot++) {
            if (QuickFillContainerPolicy.canUseSlot(target, slot) && targetInv.getItem(slot)) {
                itemsRemain = true;
                break;
            }
        }

        this.sendRemoveAllFeedback(player, changedSlots, itemsRemain);
    }

    static transferToContainer(player, block, itemStack, blockInv = block.getComponent(BlockComponentTypes.Inventory)?.container) {
        const playerInv = player.getComponent(EntityComponentTypes.Inventory)?.container;
        if (!blockInv || !playerInv)
            return;
        const changedSlots = this.transferAllItemType(playerInv, blockInv, itemStack.typeId, block);
        const destinationFull = !changedSlots && !InventoryUtils.hasAvailableSpace(blockInv, itemStack, slot => QuickFillContainerPolicy.canInsertItem(block, itemStack, slot));
        this.sendFeedbackMessage(true, player, block, itemStack, changedSlots, destinationFull);
    }

    static transferAllItemType(fromContainer, toContainer, itemTypeId, block, sourceTarget) {
        const changedTargetSlots = block ? new Set() : undefined;
        let changedSourceSlots = 0;
        for (let slotIndex = 0; slotIndex < fromContainer.size; slotIndex++) {
            if (sourceTarget && !QuickFillContainerPolicy.canUseSlot(sourceTarget, slotIndex))
                continue;

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

    static addItemToBlock(block, container, itemStack, changedSlots) {
        let remainingAmount = this.addToExistingStacks(block, container, itemStack, changedSlots);
        remainingAmount = this.addToEmptySlots(block, container, itemStack, changedSlots, remainingAmount);

        if (!remainingAmount)
            return;

        const remaining = itemStack.clone();
        remaining.amount = remainingAmount;
        return remaining;
    }

    static addToExistingStacks(block, container, itemStack, changedSlots) {
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
        return remainingAmount;
    }

    static addToEmptySlots(block, container, itemStack, changedSlots, remainingAmount) {
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
        return remainingAmount;
    }

    static sendRemoveAllFeedback(player, changedSlots, itemsRemain) {
        if (!changedSlots) {
            player.onScreenDisplay.setActionBar(itemsRemain
                ? '§7Quick Fill: player inventory is full.'
                : '§7Quick Fill: nothing to remove.');
            return;
        }

        const slotText = changedSlots === 1 ? 'slot' : 'slots';
        const action = itemsRemain
            ? 'removed items until player inventory was full'
            : 'removed all items';
        player.onScreenDisplay.setActionBar(`§7Quick Fill: ${action}. (§a${changedSlots}§7 ${slotText})`);
    }

    static sendFeedbackMessage(isFilling, player, block, itemStack, changedSlots, destinationFull = false) {
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
