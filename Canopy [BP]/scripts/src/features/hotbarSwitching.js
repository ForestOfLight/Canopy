import { system, world } from '@minecraft/server';
import HotbarManager from 'src/classes/HotbarManager';

const ARROW_SLOT = 17;
const lastSelectedSlots = {};
const lastLoadedSlots = {};
const hotbarManagers = {};

system.runInterval(() => {
    if (!world.getDynamicProperty('hotbarSwitching')) return;
    const players = world.getAllPlayers();
    for (const player of players) {
        if (!hasAppropriateGameMode(player)) continue;
        if (hotbarManagers[player.id] === undefined) 
            hotbarManagers[player.id] = new HotbarManager(player);
        processHotbarSwitching(player);
    }
});

function hasAppropriateGameMode(player) {
    return world.getDynamicProperty('hotbarSwitchingSurvival') || player.getGameMode() === 'creative';
}

function processHotbarSwitching(player) {
    if (lastSelectedSlots[player.id] !== undefined && (!hasArrowInCorrectSlot(player) || !isInAppropriateGameMode(player))) {
        delete lastSelectedSlots[player.id];
        return;
    } else if (lastSelectedSlots[player.id] === undefined && (!hasArrowInCorrectSlot(player) || !isInAppropriateGameMode(player))) {
        return;
    }
    if (hasScrolled(player) && player.isSneaking) {
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

function isInAppropriateGameMode(player) {
    return world.getDynamicProperty('hotbarSwitchingInSurvival') || player.getGameMode() === 'creative';
}

function hasScrolled(player) {
    return player.selectedSlotIndex !== lastSelectedSlots[player.id];
}
