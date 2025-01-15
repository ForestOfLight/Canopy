import InfoDisplayElement from './InfoDisplayElement.js';

class ChunkCoords extends InfoDisplayElement {
    player;

    constructor(player) {
        super('chunkCoords', { translate: 'rules.infoDisplay.chunkCoords' }, 3);
        this.player = player;
    }

    getFormattedDataOwnLine() {
        const chunkLocation = this.getChunkCoords(this.player);
        return { translate: 'rules.infoDisplay.chunkCoords.display', with: [`${chunkLocation.x} ${chunkLocation.y} ${chunkLocation.z}`] };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }

    getChunkCoords(player) {
        const x = Math.floor(this.player.location.x / 16);
        const y = Math.floor(this.player.location.y / 16);
        const z = Math.floor(this.player.location.z / 16);
        return { x, y, z };
    }
}

export default ChunkCoords;