import InfoDisplayElement from './InfoDisplayElement.js';
import ProbeManager from 'src/classes/ProbeManager';

class Biome extends InfoDisplayElement {
    player;

    constructor(player) {
        super('biome', { translate: 'rules.infoDisplay.biome' }, 5);
        this.player = player;
    }

    getFormattedDataOwnLine() {
        return { translate: 'rules.infoDisplay.biome.display', with: [ProbeManager.getBiome(this.player)] };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }
}

export default Biome;