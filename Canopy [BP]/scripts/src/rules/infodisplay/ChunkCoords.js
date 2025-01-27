import InfoDisplayElement from './InfoDisplayElement.js';

class ChunkCoords extends InfoDisplayElement {
    constructor(player, displayLine) {
        const ruleData = { identifier: 'chunkCoords', description: { translate: 'rules.infoDisplay.chunkCoords' } };
        super(ruleData, displayLine);
        this.player = player;
    }

    getFormattedDataOwnLine() {
        const chunkLocation = this.getChunkCoords(this.player);
        return { translate: 'rules.infoDisplay.chunkCoords.display', with: [`${chunkLocation.x} ${chunkLocation.y} ${chunkLocation.z}`] };
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
}

export default ChunkCoords;