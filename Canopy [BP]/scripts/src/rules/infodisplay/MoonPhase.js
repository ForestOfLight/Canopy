import InfoDisplayElement from './InfoDisplayElement.js';
import { world, MoonPhase } from '@minecraft/server';

class MoonPhase extends InfoDisplayElement {
    constructor() {
        super('moonPhase', { translate: 'rules.infoDisplay.moonPhase' }, 8, true);
    }

    getFormattedDataOwnLine() {
        return { translate: 'rules.infoDisplay.moonPhase.display', with: [this.getParsedMoonPhase()] };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }

    getParsedMoonPhase() {
        switch (world.getMoonPhase()) {
            case 0:
                return 'Full Moon';
            case 1:
                return 'Waning Gibbous';
            case 2:
                return 'First Quarter';
            case 3:
                return 'Waning Crescent';
            case 4:
                return 'New Moon';
            case 5:
                return 'Waxing Crescent';
            case 6:
                return 'Last Quarter';
            case 7:
                return 'Waxing Gibbous';
            default:
                return 'Unknown';
        }
    }
}

export default MoonPhase;