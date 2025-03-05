import InfoDisplayElement from './InfoDisplayElement.js';
import ProbeManager from '../../classes/ProbeManager';

class Light extends InfoDisplayElement {
    player;

    constructor(player, displayLine) {
        const ruleData = { 
            identifier: 'light',
            description: { translate: 'rules.infoDisplay.light' },
            onDisableCallback: () => ProbeManager.removeProbe(player)
        };
        super(ruleData, displayLine);
        this.player = player;
    }

    getFormattedDataOwnLine() {
        return { translate: 'rules.infoDisplay.light.display', with: [String(ProbeManager.getLightLevel(this.player))] };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }
}

export default Light;