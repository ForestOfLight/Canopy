import { world } from "@minecraft/server";

class EntityLog {
    constructor(type, { main, secondary, tertiary }) {
        if (this.constructor === EntityLog)
            throw new Error("Cannot instantiate abstract class 'EntityLog'.");
        this.type = type;
        this.colors = { main, secondary, tertiary };
        this.subscribedPlayers = [];
        world.beforeEvents.playerLeave.subscribe((event) => this.onPlayerLeave(event));
    }

    subscribe(player) {
        this.subscribedPlayers.push(player);
    }

    unsubscribe(player) {
        this.subscribedPlayers = this.subscribedPlayers.filter(subscribedPlayer => subscribedPlayer.id !== player.id);
    }

    includes(player) {
        return this.subscribedPlayers.some(subscribedPlayer => subscribedPlayer.id === player.id);
    }

    onPlayerLeave(event) {
        this.unsubscribe(event.player);
    }
}

export { EntityLog };