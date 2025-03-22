import { system, world, InputButton, ButtonState } from "@minecraft/server";

class PlayerStartSneakEvent {
    runner;
    playersSneakingThisTick = [];
    playersSneakingLastTick = [];
    callbacks = [];

    constructor() {
        this.playersSneakingThisTick = [];
        this.playersSneakingLastTick = [];
        this.callbacks = [];
    }

    subscribe(callback) {
        if (!this.isTracking())
            this.startSneakTracking(callback);
        this.callbacks.push(callback);
    }
    
    unsubscribe(callback) {
        this.removeCallback(callback);
        if (this.callbacks.length === 0)
            this.endSneakTracking();
    }

    startSneakTracking() {
        this.playerSneakingLastTick = system.currentTick;
        this.runner = system.runInterval(this.onTick.bind(this));
    }

    onTick() {
        this.updateSneaks();
        this.sendEvents();
    }

    updateSneaks() {
        this.playersSneakingLastTick = [...this.playersSneakingThisTick];
        this.playersSneakingThisTick = [];
        world.getAllPlayers().forEach(player => {
            if (this.isPlayerSneaking(player))
                this.playersSneakingThisTick.push(player);
        });
    }

    sendEvents() {
        const playersStartedSneak = this.getPlayersWhoStartedSneaking();
        if (playersStartedSneak.length === 0) return;
        this.callbacks.forEach(callback => {
            const event = {
                players: playersStartedSneak
            }
            callback(event);
        });
    }

    getPlayersWhoStartedSneaking() {
        return this.playersSneakingThisTick.filter(player => 
            !this.playersSneakingLastTick.includes(player)
        );
    }

    removeCallback(callback) {
        this.callbacks = this.callbacks.filter(cb => cb !== callback);
    }

    isTracking() {
        return this.callbacks.length > 0;
    }

    isPlayerSneaking(player) {
        return player && player.inputInfo.getButtonState(InputButton.Sneak) === ButtonState.Pressed;
    }

    endSneakTracking() {
        system.clearRun(this.runner);
    }
}

const playerStartSneakEvent = new PlayerStartSneakEvent();

export { PlayerStartSneakEvent, playerStartSneakEvent };