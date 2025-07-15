import { ButtonState, InputButton, system, world } from "@minecraft/server";
import { Rule, Rules } from "../../lib/canopy/Canopy";

new Rule({
    category: 'Rules',
    identifier: 'quickFillContainer',
    description: { translate: 'rules.quickFillContainer' }
});

const ARROW_SLOT = 9;
const BANNED_CONTAINERS = ['minecraft:beacon', 'minecraft:jukebox', 'minecraft:lectern'];

world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
    const player = event.player;
    const block = event.block;
    if (!player || !Rules.getNativeValue('quickFillContainer') || BANNED_CONTAINERS.includes(block?.typeId))
        return;
    const blockInv = block.getComponent('inventory')?.container;
    const playerInv = player.getComponent('inventory')?.container;
    if (!playerInv || !blockInv || playerInv.getItem(ARROW_SLOT)?.typeId !== 'minecraft:arrow')
        return;
    const handItemStack = event.itemStack;
    if (!handItemStack || (block.typeId.includes('shulker_box') && handItemStack.typeId.includes('shulker_box')))
        return;
    event.cancel = true;

    const playerIsSneaking = player.inputInfo.getButtonState(InputButton.Sneak) === ButtonState.Pressed;
    system.run(() => {
        if (playerIsSneaking)
            transferToPlayer(player, block, handItemStack);
        else
            transferToContainer(player, block, handItemStack);
    });
});

function transferToContainer(player, block, itemStack) {
    const blockInv = block.getComponent('inventory')?.container;
    const playerInv = player.getComponent('inventory')?.container;
    if (!blockInv || !playerInv)
        return;
    const successfulTransfers = transferAllItemType(playerInv, blockInv, itemStack.typeId);
    if (successfulTransfers > 0)
        sendFeedbackMessage(true, player, block, itemStack, blockInv);
}

function transferToPlayer(player, block, itemStack) {
    const blockInv = block.getComponent('inventory')?.container;
    const playerInv = player.getComponent('inventory')?.container;
    if (!blockInv || !playerInv)
        return;
    const successfulTransfers = transferAllItemType(blockInv, playerInv, itemStack.typeId);
    if (successfulTransfers > 0)
        sendFeedbackMessage(false, player, block, itemStack, playerInv);
}

function transferAllItemType(fromContainer, toContainer, itemTypeId) {
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

function sendFeedbackMessage(isFilling, player, block, itemStack, inventory) {
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
