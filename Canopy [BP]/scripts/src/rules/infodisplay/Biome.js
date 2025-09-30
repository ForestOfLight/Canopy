import { InfoDisplayElement } from './InfoDisplayElement.js';

class Biome extends InfoDisplayElement {
    player;

    constructor(player, displayLine) {
        const ruleData = { 
            identifier: 'biome', 
            description: { translate: 'rules.infoDisplay.biome' }
        };
        super(ruleData, displayLine);
        this.player = player;
    }

    getFormattedDataOwnLine() {
        let biomeId = '?';
        try {
            biomeId = this.player.dimension.getBiome(this.player.location)?.id;
        } catch (error) {
            if (!["LocationOutOfWorldBoundariesError", "LocationInUnloadedChunkError"].includes(error.name))
                throw error;
        }
        biomeId = biomeId.replace('minecraft:', '');
        return { translate: 'rules.infoDisplay.biome.display', with: [biomeId] };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }
}

export default Biome;