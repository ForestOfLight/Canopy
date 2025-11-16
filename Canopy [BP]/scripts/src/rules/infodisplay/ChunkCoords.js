import { InfoDisplayElement } from './InfoDisplayElement.js';

class ChunkCoords extends InfoDisplayElement {
    constructor(player, displayLine) {
        const ruleData = { identifier: 'chunkCoords', description: { translate: 'rules.infoDisplay.chunkCoords' } };
        super(ruleData, displayLine);
        this.player = player;
    }

    getFormattedDataOwnLine() {
        const chunkCoord = this.getChunkCoords(this.player);
        const withinChunkCoord = this.getWithinChunkCoords(this.player);
        return { translate: 'rules.infoDisplay.chunkCoords.display', with: [
            `§d${String(withinChunkCoord.x).padStart(2, '0')} ${String(withinChunkCoord.y).padStart(2, '0')} ${String(withinChunkCoord.z).padStart(2, '0')}`,
            `§l§d${chunkCoord.x} ${chunkCoord.y} ${chunkCoord.z}`
        ] };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }

    getChunkCoords() {
        const chunkX = Math.floor(this.player.location.x / 16);
        const chunkY = Math.floor(this.player.location.y / 16);
        const chunkZ = Math.floor(this.player.location.z / 16);
        return { x: chunkX, y: chunkY, z: chunkZ };
    }

    getWithinChunkCoords() {
        const chunkCoord = this.getChunkCoords(this.player);
        return {
            x: Math.floor(this.player.location.x - (chunkCoord.x * 16)), 
            y: Math.floor(this.player.location.y - (chunkCoord.y * 16)), 
            z: Math.floor(this.player.location.z - (chunkCoord.z * 16))
        };
    }
}

export { ChunkCoords };