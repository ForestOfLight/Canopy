import { Rule } from "lib/canopy/Canopy";
import { system, world, InputButton, ButtonState } from '@minecraft/server';
import HotbarManager from 'src/classes/HotbarManager';

new Rule({
    category: 'Rules',
    identifier: 'hotbarSwitching',
    description: { translate: 'rules.hotbarSwitching' },
});

new Rule({
    category: 'Rules',
    identifier: 'hotbarSwitchingSurvival',
    description: { translate: 'rules.hotbarSwitchingSurvival' },
    contingentRules: ['hotbarSwitching'],
});

const ARROW_SLOT = 17;
const lastSelectedSlots = {};
const lastLoadedSlots = {};
const hotbarManagers = {};

system.runInterval(async () => {
    if (!await Rule.getValue('hotbarSwitching')) return;
    const players = world.getAllPlayers();
    for (const player of players) {
        if (!player) continue;
        if (!await hasAppropriateGameMode(player)) continue;
        if (hotbarManagers[player.id] === undefined) 
            hotbarManagers[player.id] = new HotbarManager(player);
        processHotbarSwitching(player);
    }
});

async function hasAppropriateGameMode(player) {
    return await Rule.getValue('hotbarSwitchingSurvival') || player.getGameMode() === 'creative';
}

async function processHotbarSwitching(player) {
    if (lastSelectedSlots[player.id] !== undefined && (!hasArrowInCorrectSlot(player) || !await hasAppropriateGameMode(player))) {
        delete lastSelectedSlots[player.id];
        return;
    } else if (lastSelectedSlots[player.id] === undefined && (!hasArrowInCorrectSlot(player) || !await hasAppropriateGameMode(player))) {
        return;
    }
    if (hasScrolled(player) && player.inputInfo.getButtonState(InputButton.Sneak) === ButtonState.Pressed) {
        switchToHotbar(player, player.selectedSlotIndex);
    }
    lastSelectedSlots[player.id] = player.selectedSlotIndex;
}

function switchToHotbar(player, index) {
    if (lastLoadedSlots[player.id] === undefined) 
        lastLoadedSlots[player.id] = lastSelectedSlots[player.id];    
    const hotbarMgr = hotbarManagers[player.id];
    hotbarMgr.saveHotbar(lastLoadedSlots[player.id]);
    hotbarMgr.loadHotbar(index)
    lastLoadedSlots[player.id] = index;
    player.onScreenDisplay.setActionBar(`§a${index + 1}`);
}

function hasArrowInCorrectSlot(player) {
    const container = player.getComponent('inventory')?.container;
    return container?.getItem(ARROW_SLOT)?.typeId === 'minecraft:arrow';
}

function hasScrolled(player) {
    return player.selectedSlotIndex !== lastSelectedSlots[player.id];
}
