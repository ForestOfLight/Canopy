import { Rule } from "lib/canopy/Canopy";
import { system, world, InputButton, ButtonState, EntityComponentTypes, GameMode } from '@minecraft/server';
import HotbarManager from 'src/classes/HotbarManager';

let runner;
new Rule({
    category: 'Rules',
    identifier: 'hotbarSwitching',
    description: { translate: 'rules.hotbarSwitching' },
    onEnableCallback: () => {
        runner = system.runInterval(onTick.bind(this));
    },
    onDisableCallback: () => {
        system.clearRun(runner);
    }
});

const ARROW_SLOT = 17;
const lastSelectedSlots = {};
const hotbarManagers = {};

function onTick() {
    const players = world.getAllPlayers();
    for (const player of players) {
        if (!player) continue;
        if (!hasAppropriateGameMode(player)) continue;
        if (hotbarManagers[player.id] === undefined) 
            hotbarManagers[player.id] = new HotbarManager(player);
        processHotbarSwitching(player);
    }
}

function hasAppropriateGameMode(player) {
    return player.getGameMode() === GameMode.Creative;
}

function processHotbarSwitching(player) {
    if (lastSelectedSlots[player.id] !== undefined && (!hasArrowInCorrectSlot(player) || !hasAppropriateGameMode(player))) {
        delete lastSelectedSlots[player.id];
        return;
    }
    if (lastSelectedSlots[player.id] === undefined && (!hasArrowInCorrectSlot(player) || !hasAppropriateGameMode(player)))
        return;
    if (hasScrolled(player) && player.inputInfo.getButtonState(InputButton.Sneak) === ButtonState.Pressed) 
        switchToHotbar(player, player.selectedSlotIndex);
    lastSelectedSlots[player.id] = player.selectedSlotIndex;
}

function switchToHotbar(player, index) {
    const hotbarMgr = hotbarManagers[player.id];
    hotbarMgr.saveHotbar();
    hotbarMgr.loadHotbar(index);
    player.onScreenDisplay.setActionBar(`§a${index + 1}`);
}

function hasArrowInCorrectSlot(player) {
    const container = player.getComponent(EntityComponentTypes.Inventory)?.container;
    return container?.getItem(ARROW_SLOT)?.typeId === 'minecraft:arrow';
}

function hasScrolled(player) {
    return player.selectedSlotIndex !== lastSelectedSlots[player.id];
}
