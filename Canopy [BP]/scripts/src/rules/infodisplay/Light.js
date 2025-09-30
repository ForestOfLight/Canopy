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
        let skyLightLevel = '?';
        try {
            lightLevel = this.player.dimension.getLightLevel(this.player.location);
            skyLightLevel = this.player.dimension.getSkyLightLevel(this.player.location);
        } catch (error) {
            if (error.name !== "LocationInUnloadedChunkError")
                throw error;
        }
        return { translate: 'rules.infoDisplay.light.display', with: [String(lightLevel), String(skyLightLevel)] };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }
}

export default Light;