import { system, world } from "@minecraft/server";
import { Rule, Rules } from "../../lib/canopy/Canopy";

new Rule({
    category: 'Rules',
    identifier: 'quickFillContainer',
    description: { translate: 'rules.quickFillContainer' },
});

const ARROW_SLOT = 9;
const BANNED_CONTAINERS = ['minecraft:beacon', 'minecraft:jukebox', 'minecraft:lectern'];

world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
    if (!Rules.getNativeValue('quickFillContainer')) return;
    const player = event.player;
    if (!player) return;
    const block = event.block;
    if (BANNED_CONTAINERS.includes(block?.typeId)) return;
    const blockInv = block.getComponent('inventory')?.container;
    if (!blockInv) return;
    const playerInv = player.getComponent('inventory')?.container;
    if (!playerInv || playerInv.getItem(ARROW_SLOT)?.typeId !== 'minecraft:arrow') return;
    const handItemStack = event.itemStack;
    if (!handItemStack) return;
    if (block.typeId.includes('shulker_box') && handItemStack.typeId.includes('shulker_box')) return;
    event.cancel = true;

    system.run(() => {
        const successfulTransfers = transferAllItemType(playerInv, blockInv, handItemStack.typeId);
        if (successfulTransfers === 0) { // true either no items were transferred OR the stacks in the container were only topped off
            return;
        }
        const feedback = { rawtext: [{ translate: 'rules.quickFillContainer.filled', with: [block.typeId.replace('minecraft:', ''), handItemStack.typeId.replace('minecraft:', '')] }] };
        feedback.rawtext.push({ text: ` (§a${blockInv.size - blockInv.emptySlotsCount}§7/§a${blockInv.size}§7)` });
        player.onScreenDisplay.setActionBar(feedback);
    });
});

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
