class EntityLog {
    constructor(type, { main, secondary, tertiary }) {
        if (this.constructor === EntityLog)
            throw new Error("Cannot instantiate abstract class 'EntityLog'.");
        this.type = type;
        this.colors = { main, secondary, tertiary };
        this.subscribedPlayers = [];
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
}

export { EntityLog };