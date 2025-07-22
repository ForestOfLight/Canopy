import { system, world, InputButton, ButtonState } from "@minecraft/server";
import { Event } from './Event';

class PlayerStartSneakEvent extends Event {
    playersSneakingThisTick = [];
    playersSneakingLastTick = [];

    constructor() {
        super();
        this.playersSneakingThisTick = [];
        this.playersSneakingLastTick = [];
    }

    startTrackingEvent() {
        this.runner = system.runInterval(this.onTick.bind(this));
    }

    provideEvents() {
        this.updateSneakingLists();
        const playersStartedSneak = this.getPlayersWhoStartedSneaking();
        return playersStartedSneak.map(player => ({ player }));
    }

    updateSneakingLists() {
        this.playersSneakingLastTick = [...this.playersSneakingThisTick];
        this.playersSneakingThisTick = [];
        world.getAllPlayers().forEach(player => {
            if (this.isPlayerSneaking(player))
                this.playersSneakingThisTick.push(player);
        });
    }

    getPlayersWhoStartedSneaking() {
        return this.playersSneakingThisTick.filter(player => 
            !this.playersSneakingLastTick.includes(player)
        );
    }

    isPlayerSneaking(player) {
        return player && player.inputInfo.getButtonState(InputButton.Sneak) === ButtonState.Pressed;
    }

    stopTrackingEvent() {
        system.clearRun(this.runner);
    }
}

const playerStartSneakEvent = new PlayerStartSneakEvent();

export { PlayerStartSneakEvent, playerStartSneakEvent };