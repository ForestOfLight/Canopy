import { ButtonState, GameMode, InputButton, system, world } from "@minecraft/server";
import { AbilityRule } from "../../lib/canopy/Canopy";
import { QuickFillClipboardController } from "../classes/QuickFillClipboardController";
import { QuickFillContainerPolicy } from "../classes/QuickFillContainerPolicy";

class QuickFillContainer extends AbilityRule {
    bannedContainers = ['minecraft:beacon', 'minecraft:jukebox', 'minecraft:lectern'];
    
    constructor() {
        super({
            identifier: 'quickFillContainer',
            wikiDescription: 'With an arrow in the top left of your inventory (slot 9), using an item on a container moves all matching items from your inventory into the container. Hold sneak to reverse the flow.',
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
        const blockInv = block.getComponent('inventory')?.container;
        const playerInv = player.getComponent('inventory')?.container;
        if (!playerInv || !blockInv)
            return;
        const handItemStack = event.itemStack;
        const clipboard = QuickFillClipboardController.get(player);
        if (!clipboard && (!handItemStack || (block.typeId.includes('shulker_box') && handItemStack.typeId.includes('shulker_box'))))
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
        if (!block.getComponent('inventory')?.container)
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
        const blockInv = block.getComponent('inventory')?.container;
        if (!blockInv || !QuickFillContainerPolicy.canDirectFill(block, blockInv))
            return;

        const fullStack = itemStack.clone();
        fullStack.amount = fullStack.maxAmount;
        let filledSlots = 0;

        for (let slot = 0; slot < blockInv.size; slot++) {
            try {
                blockInv.setItem(slot, fullStack.clone());
                filledSlots++;
            } catch {
                continue;
            }
        }

        if (filledSlots > 0)
            this.sendFeedbackMessage(true, player, block, itemStack, blockInv);
    }
    transferToPlayer(player, block, itemStack) {
        const blockInv = block.getComponent('inventory')?.container;
        const playerInv = player.getComponent('inventory')?.container;
        if (!blockInv || !playerInv)
            return;
        const successfulTransfers = this.transferAllItemType(blockInv, playerInv, itemStack.typeId);
        if (successfulTransfers > 0)
            this.sendFeedbackMessage(false, player, block, itemStack, playerInv);
    }

    transferToContainer(player, block, itemStack) {
        const blockInv = block.getComponent('inventory')?.container;
        const playerInv = player.getComponent('inventory')?.container;
        if (!blockInv || !playerInv)
            return;
        const successfulTransfers = this.transferAllItemType(playerInv, blockInv, itemStack.typeId);
        if (successfulTransfers > 0)
            this.sendFeedbackMessage(true, player, block, itemStack, blockInv);
    }

    transferAllItemType(fromContainer, toContainer, itemTypeId) {
        let successfulTransfers = 0;
        for (let slotIndex = 0; slotIndex < fromContainer.size; slotIndex++) {
            const currFromItem = fromContainer.getItem(slotIndex);
            if (currFromItem?.typeId === itemTypeId) {
                const untransferred = toContainer.addItem(currFromItem);
                if (untransferred) {
                    fromContainer.setItem(slotIndex, untransferred);
                } else {
                    fromContainer.setItem(slotIndex, null);
                    successfulTransfers++;
                }
            }
        }
        return successfulTransfers;
    }

    sendFeedbackMessage(isFilling, player, block, itemStack, inventory) {
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
        feedback.rawtext.push({ text: ` (§a${inventory.size - inventory.emptySlotsCount}§7/§a${inventory.size}§7)` });
        player.onScreenDisplay.setActionBar(feedback);
    }
}

export const quickFillContainer = new QuickFillContainer();