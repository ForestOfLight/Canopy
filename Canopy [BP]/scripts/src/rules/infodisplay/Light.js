import InfoDisplayElement from './InfoDisplayElement.js';
import ProbeManager from 'src/classes/ProbeManager';

class Light extends InfoDisplayElement {
    player;

    constructor(player) {
        this.player = player;
        super('light', { translate: 'rules.infoDisplay.light' }, 4);
    }

    getFormattedDataOwnLine() {
        return { translate: 'rules.infoDisplay.light.display', with: [String(ProbeManager.getLightLevel(this.player))] };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }
}

export default Light;