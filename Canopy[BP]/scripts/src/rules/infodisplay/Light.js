import { InfoDisplayTextElement } from './InfoDisplayTextElement.js';

class Light extends InfoDisplayTextElement {
    player;

    constructor(player, displayLine) {
        const ruleData = {
            identifier: 'light',
            description: { translate: 'rules.infoDisplay.light' },
            wikiDescription: 'Shows the light level at your feet, including the sky light contribution.'
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
        return { translate: 'rules.infoDisplay.light.display', with: ['§e' + lightLevel, '§b' + skyLightLevel] };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine(); 
    }
}

export default Light;