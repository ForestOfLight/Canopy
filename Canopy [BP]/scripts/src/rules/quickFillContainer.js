import { ButtonState, InputButton, system, world } from "@minecraft/server";
import { AbilityRule } from "../../lib/canopy/Canopy";

class QuickFillContainer extends AbilityRule {
    bannedContainers = ['minecraft:beacon', 'minecraft:jukebox', 'minecraft:lectern'];
    
    constructor() {
        super({
            identifier: 'quickFillContainer',
            onEnableCallback: () => { world.beforeEvents.playerInteractWithBlock.subscribe(this.onPlayerInteractWithBlockBound); },
            onDisableCallback: () => { world.beforeEvents.playerInteractWithBlock.unsubscribe(this.onPlayerInteractWithBlockBound); }
        }, { slotNumber: 9 });
        this.onPlayerInteractWithBlockBound = this.onPlayerInteractWithBlock.bind(this);
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
        if (!handItemStack || (block.typeId.includes('shulker_box') && handItemStack.typeId.includes('shulker_box')))
            return;
        event.cancel = true;

        const playerIsSneaking = player.inputInfo.getButtonState(InputButton.Sneak) === ButtonState.Pressed;
        system.run(() => {
            if (playerIsSneaking)
                this.transferToPlayer(player, block, handItemStack);
            else
                this.transferToContainer(player, block, handItemStack);
        });
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
            feedback.rawtext.push({ rawtext: [
                { translate: `rules.quickFillContainer.filled.pt1` },
                { translate: block.localizationKey },
                { translate: `rules.quickFillContainer.filled.pt2` },
                { translate: itemStack.localizationKey }
            ]});
        } else {
            feedback.rawtext.push({ rawtext: [
                { translate: `rules.quickFillContainer.taken.pt1` },
                { translate: itemStack.localizationKey },
                { translate: `rules.quickFillContainer.taken.pt2` },
                { translate: block.localizationKey }
            ]});
        }
        feedback.rawtext.push({ text: ` (§a${inventory.size - inventory.emptySlotsCount}§7/§a${inventory.size}§7)` });
        player.onScreenDisplay.setActionBar(feedback);
    }
}

export const quickFillContainer = new QuickFillContainer();