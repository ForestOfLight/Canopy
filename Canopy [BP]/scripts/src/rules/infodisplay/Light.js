import { InfoDisplayElement } from './InfoDisplayElement.js';

class Light extends InfoDisplayElement {
    player;

    constructor(player, displayLine) {
        const ruleData = { 
            identifier: 'light',
            description: { translate: 'rules.infoDisplay.light' }
        };
        super(ruleData, displayLine);
        this.player = player;
    }

    getFormattedDataOwnLine() {
        let lightLevel = '?';
        try {
            lightLevel = this.player.dimension.getLightLevel(this.player.location);
        } catch (error) {
            if (error.name !== "LocationInUnloadedChunk")
                throw error;
        }
        return { translate: 'rules.infoDisplay.biome.display', with: [String(lightLevel)] };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }
}

export default Light;