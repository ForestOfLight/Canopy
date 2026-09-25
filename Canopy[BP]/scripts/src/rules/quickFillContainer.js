import { BlockComponentTypes, ButtonState, EntityComponentTypes, GameMode, InputButton, system, world } from "@minecraft/server";
import { AbilityRule } from "../../lib/canopy/Canopy";
import { InventoryUtils } from "../classes/InventoryUtils";
import { QuickFillClipboardController } from "../classes/quickfill/QuickFillClipboardController";
import { QuickFillContainerPolicy } from "../classes/quickfill/QuickFillContainerPolicy";

class QuickFillContainer extends AbilityRule {
    bannedContainers = ['minecraft:beacon', 'minecraft:jukebox', 'minecraft:lectern'];
    
    constructor() {
        super({
            identifier: 'quickFillContainer',
            wikiDescription: 'With an arrow in the top left of your inventory (slot 9), interact with a container while holding an item to move matching items into it; sneak to reverse, or sneak + interact with an empty hand to remove all. Break a block container or attack a supported storage entity to copy it. With the clipboard active, interact to paste, sneak + interact to remove, and sneak + break/attack to deactivate it.',
            onEnableCallback: () => {
                world.beforeEvents.playerInteractWithBlock.subscribe(this.onPlayerInteractWithBlockBound);
                world.beforeEvents.playerBreakBlock.subscribe(this.onPlayerBreakBlockBound);
                world.beforeEvents.playerInteractWithEntity.subscribe(this.onPlayerInteractWithEntityBound);
                world.beforeEvents.entityHurt.subscribe(this.onEntityHurtBound);
            },
            onDisableCallback: () => {
                world.beforeEvents.playerInteractWithBlock.unsubscribe(this.onPlayerInteractWithBlockBound);
                world.beforeEvents.playerBreakBlock.unsubscribe(this.onPlayerBreakBlockBound);
                world.beforeEvents.playerInteractWithEntity.unsubscribe(this.onPlayerInteractWithEntityBound);
                world.beforeEvents.entityHurt.unsubscribe(this.onEntityHurtBound);
            }
        }, { slotNumber: 9 });
        this.onPlayerInteractWithBlockBound = this.onPlayerInteractWithBlock.bind(this);
        this.onPlayerBreakBlockBound = this.onPlayerBreakBlock.bind(this);
        this.onPlayerInteractWithEntityBound = this.onPlayerInteractWithEntity.bind(this);
        this.onEntityHurtBound = this.onEntityHurt.bind(this);
    }

    onPlayerInteractWithBlock(event) {
        const player = event.player;
        const block = event.block;
        if (!player || !this.isEnabledForPlayer(player) || this.bannedContainers.includes(block?.typeId))
            return;

        const blockInv = block.typeId === 'minecraft:ender_chest'
            ? player.getComponent(EntityComponentTypes.EnderInventory)?.container
            : block.getComponent(BlockComponentTypes.Inventory)?.container;
        const playerInv = player.getComponent(EntityComponentTypes.Inventory)?.container;
        if (!playerInv || !blockInv)
            return;

        const handItemStack = event.itemStack;
        const clipboard = QuickFillClipboardController.get(player);
        const playerIsSneaking = player.inputInfo.getButtonState(InputButton.Sneak) === ButtonState.Pressed;
        const removeAll = !clipboard && !handItemStack && playerIsSneaking;
        if (removeAll && QuickFillContainerPolicy.isClipboardOnly(block))
            return;
        if (!removeAll && ((!clipboard || !handItemStack) && (QuickFillContainerPolicy.isClipboardOnly(block) || !QuickFillContainerPolicy.canInsertItem(block, handItemStack))))
            return;
        event.cancel = true;

        this.handleQuickFillInteraction(player, block, blockInv, handItemStack, clipboard);
    }

    onPlayerBreakBlock(event) {
        const player = event.player;
        const block = event.block;
        if (!player || !this.isEnabledForPlayer(player) || this.bannedContainers.includes(block?.typeId))
            return;
        const blockInv = block.typeId === 'minecraft:ender_chest'
            ? player.getComponent(EntityComponentTypes.EnderInventory)?.container
            : block.getComponent(BlockComponentTypes.Inventory)?.container;
        if (!blockInv)
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
            QuickFillClipboardController.copy(player, block, blockInv);
        });
    }

    onPlayerInteractWithEntity(event) {
        const player = event.player;
        const entity = event.target;
        if (!player || !this.isEnabledForPlayer(player))
            return;

        const entityInv = QuickFillContainerPolicy.getInteractableEntityContainer(entity);
        const playerInv = player.getComponent(EntityComponentTypes.Inventory)?.container;
        if (!playerInv || !entityInv)
            return;

        const handItemStack = event.itemStack;
        const clipboard = QuickFillClipboardController.get(player);
        const playerIsSneaking = player.inputInfo.getButtonState(InputButton.Sneak) === ButtonState.Pressed;
        const removeAll = !clipboard && !handItemStack && playerIsSneaking;
        if (!removeAll && (!handItemStack || (!clipboard && !QuickFillContainerPolicy.canInsertItem(entity, handItemStack))))
            return;
        event.cancel = true;

        this.handleQuickFillInteraction(player, entity, entityInv, handItemStack, clipboard);
    }

    handleQuickFillInteraction(player, target, targetInv, handItemStack, clipboard) {
        const playerIsSneaking = player.inputInfo.getButtonState(InputButton.Sneak) === ButtonState.Pressed;
        system.run(() => {
            if (clipboard) {
                QuickFillClipboardController.apply(player, target, clipboard, playerIsSneaking, targetInv);
                return;
            }
            if (playerIsSneaking) {
                if (!handItemStack) {
                    this.transferAllToPlayer(player, target, targetInv);
                    return;
                }
                this.transferToPlayer(player, target, handItemStack, targetInv);
            } else if (player.getGameMode() === GameMode.Creative)
                this.fillCreative(player, target, handItemStack, targetInv);
            else
                this.transferToContainer(player, target, handItemStack, targetInv);
        });
    }

    onEntityHurt(event) {
        const player = event.damageSource?.damagingEntity;
        const entity = event.hurtEntity;
        if (player?.typeId !== 'minecraft:player' || event.damageSource?.damagingProjectile || !this.isEnabledForPlayer(player))
            return;

        const entityInv = QuickFillContainerPolicy.getEntityContainer(entity);
        if (!entityInv)
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
            QuickFillClipboardController.copy(player, entity, entityInv);
        });
    }

    fillCreative(player, block, itemStack, blockInv = block.getComponent(BlockComponentTypes.Inventory)?.container) {
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

    transferToPlayer(player, block, itemStack, blockInv = block.getComponent(BlockComponentTypes.Inventory)?.container) {
        const playerInv = player.getComponent(EntityComponentTypes.Inventory)?.container;
        if (!blockInv || !playerInv)
            return;
        const changedSlots = this.transferAllItemType(blockInv, playerInv, itemStack.typeId, undefined, block);
        const destinationFull = !changedSlots && playerInv.emptySlotsCount === 0 && InventoryUtils.hasItemType(blockInv, itemStack.typeId, slot => QuickFillContainerPolicy.canUseSlot(block, slot));
        this.sendFeedbackMessage(false, player, block, itemStack, changedSlots, destinationFull);
    }

    transferAllToPlayer(player, target, targetInv) {
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

    transferToContainer(player, block, itemStack, blockInv = block.getComponent(BlockComponentTypes.Inventory)?.container) {
        const playerInv = player.getComponent(EntityComponentTypes.Inventory)?.container;
        if (!blockInv || !playerInv)
            return;
        const changedSlots = this.transferAllItemType(playerInv, blockInv, itemStack.typeId, block);
        const destinationFull = !changedSlots && !InventoryUtils.hasAvailableSpace(blockInv, itemStack, slot => QuickFillContainerPolicy.canInsertItem(block, itemStack, slot));
        this.sendFeedbackMessage(true, player, block, itemStack, changedSlots, destinationFull);
    }

    transferAllItemType(fromContainer, toContainer, itemTypeId, block, sourceTarget) {
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

    addItemToBlock(block, container, itemStack, changedSlots) {
        let remainingAmount = this.addToExistingStacks(block, container, itemStack, changedSlots);
        remainingAmount = this.addToEmptySlots(block, container, itemStack, changedSlots, remainingAmount);

        if (!remainingAmount)
            return;

        const remaining = itemStack.clone();
        remaining.amount = remainingAmount;
        return remaining;
    }

    addToExistingStacks(block, container, itemStack, changedSlots) {
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

    addToEmptySlots(block, container, itemStack, changedSlots, remainingAmount) {
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

    sendRemoveAllFeedback(player, changedSlots, itemsRemain) {
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
