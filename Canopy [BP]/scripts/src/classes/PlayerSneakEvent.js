import { system, world, InputButton, ButtonState } from "@minecraft/server";

class PlayerSneakEvent {
    runner;

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
        this.callbacks = this.callbacks.filter(cb => cb !== callback);
        if (this.callbacks.length === 0)
            this.endSneakTracking();
    }

    startSneakTracking() {
        this.playerSneakingLastTick = system.currentTick;
        this.runner = system.runInterval(this.onTick.bind(this));
    }

    endSneakTracking() {
        system.clearRun(this.runner);
    }

    onTick() {
        this.playersSneakingLastTick = [...this.playersSneakingThisTick];
        this.playersSneakingThisTick = [];
        world.getAllPlayers().forEach(player => {
            if (this.isPlayerSneaking(player))
                this.playersSneakingThisTick.push(player);
        });
        this.sendEvents();
    }

    sendEvents() {
        const playersStartedSneak = this.getPlayersWhoStartedSneaking();
        if (playersStartedSneak.length === 0) return;
        this.callbacks.forEach(callback => {
            const event = {
                playersStartedSneak
            }
            callback(event);
        });
    }

    getPlayersWhoStartedSneaking() {
        return this.playersSneakingThisTick.filter(player => 
            !this.playersSneakingLastTick.includes(player)
        );
    }

    isTracking() {
        return this.callbacks.length > 0;
    }

    isPlayerSneaking(player) {
        return player && player.inputInfo.getButtonState(InputButton.Sneak) === ButtonState.Pressed;
    }
}

export { PlayerSneakEvent };