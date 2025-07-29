import { world } from '@minecraft/server';
import { Event } from './Event';
import { Vector } from '../../lib/Vector';

class PlayerChangeSubChunkEvent extends Event {
    playerLocationsLastTick = {};
    playerLocationsThisTick = {};

    constructor() {
        super();
        this.playerLocationsLastTick = {};
        this.playerLocationsThisTick = {};
    }

    provideEvents() {
        this.updatePlayerLocations();
        return this.getPlayersWhoChangedSubChunks().map(player => ({
            player: player
        }));
    }

    updatePlayerLocations() {
        this.playerLocationsLastTick = { ...this.playerLocationsThisTick };
        this.playerLocationsThisTick = {};
        world.getAllPlayers().forEach(player => {
            if (!player)
                return;
            this.playerLocationsThisTick[player.id] = player.location;
        });
    }

    getPlayersWhoChangedSubChunks() {
        const changedPlayers = [];
        for (const playerId in this.playerLocationsThisTick) {
            const currentLocation = this.playerLocationsThisTick[playerId];
            const lastLocation = this.playerLocationsLastTick[playerId];
            if (!lastLocation || !this.isInSameSubChunk(currentLocation, lastLocation))
                changedPlayers.push(world.getAllPlayers().find(player => player?.id === playerId));
        }
        return changedPlayers;
    }

    isInSameSubChunk(currentLocation, lastLocation) {
        const currentChunkVec = new Vector(currentLocation.x, currentLocation.y, currentLocation.z).divide(16).floor();
        const lastChunkVec = new Vector(lastLocation.x, lastLocation.y, lastLocation.z).divide(16).floor();
        return currentChunkVec.x === lastChunkVec.x &&
               currentChunkVec.y === lastChunkVec.y &&
               currentChunkVec.z === lastChunkVec.z;
    }
}

const playerChangeSubChunkEvent = new PlayerChangeSubChunkEvent();

export { PlayerChangeSubChunkEvent, playerChangeSubChunkEvent };