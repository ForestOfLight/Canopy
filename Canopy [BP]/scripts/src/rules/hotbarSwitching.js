import { AbilityRule } from "../../lib/canopy/Canopy";
import { system, world, InputButton, ButtonState, GameMode } from '@minecraft/server';
import HotbarManager from 'src/classes/HotbarManager';

class HotbarSwitching extends AbilityRule {
    lastSelectedSlots = {};
    hotbarManagers = {};
    runner = void 0;
    
    constructor() {
        super({
            identifier: 'hotbarSwitching',
            onEnableCallback: () => { this.runner = system.runInterval(this.onTick.bind(this)); },
            onDisableCallback: () => { system.clearRun(this.runner); }
        }, {
            slotNumber: 17,
            onPlayerEnableCallback: (player) => { this.onPlayerEnableBound(player) },
            onPlayerDisableCallback: (player) => { this.onPlayerDisableBound(player) }
        });
        this.onPlayerEnableBound = this.onPlayerEnabled.bind(this);
        this.onPlayerDisableBound = this.onPlayerDisabled.bind(this);
    }

    onPlayerEnabled(player) {
        this.lastSelectedSlots[player.id] = player.selectedSlotIndex;
        if (!this.hotbarManagers[player.id])
            this.hotbarManagers[player.id] = new HotbarManager(player);
    }

    onPlayerDisabled(player) {
        delete this.lastSelectedSlots[player.id];
    }

    onTick() {
        const players = world.getAllPlayers();
        for (const player of players) {
            if (!this.isEnabledForPlayer(player) || !this.hasAppropriateGameMode(player))
                continue;
            this.processHotbarSwitching(player);
        }
    }

    processHotbarSwitching(player) {
        if (this.hasScrolled(player) && player.inputInfo.getButtonState(InputButton.Sneak) === ButtonState.Pressed) 
            this.switchToHotbar(player, player.selectedSlotIndex);
        this.lastSelectedSlots[player.id] = player.selectedSlotIndex;
    }

    switchToHotbar(player, index) {
        const hotbarMgr = this.hotbarManagers[player.id];
        hotbarMgr.saveHotbar();
        hotbarMgr.loadHotbar(index);
        player.onScreenDisplay.setActionBar(`§a${index + 1}`);
    }

    hasAppropriateGameMode(player) {
        return player.getGameMode() === GameMode.Creative;
    }

    hasScrolled(player) {
        return player.selectedSlotIndex !== this.lastSelectedSlots[player.id];
    }
}

export const hotbarSwitching = new HotbarSwitching();