import InfoDisplayElement from './InfoDisplayElement.js';
import { world, MoonPhase } from '@minecraft/server';

class MoonPhase extends InfoDisplayElement {
    constructor() {
        super('moonPhase', { translate: 'rules.infoDisplay.moonPhase' }, 7, true);
    }

    getFormattedDataOwnLine() {
        return { translate: 'rules.infoDisplay.moonPhase.display', with: [this.getParsedMoonPhase()] };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }

    getParsedMoonPhase() {
        const moonPhase = MoonPhase[world.getMoonPhase()];
        return moonPhase.replace(/([A-Z])/g, ' $1').trim();
    }
}

export default MoonPhase;