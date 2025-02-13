class EntityLog {
    constructor(type, { main, secondary, tertiary }) {
        if (this.constructor === EntityLog)
            throw new Error("Cannot instantiate abstract class 'EntityLog'.");
        this.type = type;
        this.colors = { main, secondary, tertiary };
        this.subscribedPlayers = [];
    }

    initEvents() {
        throw new Error("Method 'initEvents' must be implemented.");
    }

    onTick() {
        throw new Error("Method 'onTick' must be implemented.");
    }

    isPrintable() {
        throw new Error("Method 'isPrintable' must be implemented.");
    }

    getLogHeader() {
        throw new Error("Method 'getLogHeader' must be implemented.");
    }

    getLogBody() {
        throw new Error("Method 'getLogBody' must be implemented.");
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

export default EntityLog;