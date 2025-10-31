import { InfoDisplayElement } from './InfoDisplayElement.js';
import { world } from '@minecraft/server';

class MoonPhase extends InfoDisplayElement {
    constructor(displayLine) {
        const ruleData = { identifier: 'moonPhase', description: { translate: 'rules.infoDisplay.moonPhase' } };
        super(ruleData, displayLine, true);
    }

    getFormattedDataOwnLine() {
        return this.getParsedMoonPhase();
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }

    getParsedMoonPhase() {
        switch (world.getMoonPhase()) {
            case 0:
                return { rawtext: [{ text: '§f' }, { translate: 'rules.infoDisplay.moonPhase.full' }] };
            case 1:
                return { rawtext: [{ text: '§h' }, { translate: 'rules.infoDisplay.moonPhase.waningGibbous' }] };
            case 2:
                return { rawtext: [{ text: '§7' }, { translate: 'rules.infoDisplay.moonPhase.firstQuarter' }] };
            case 3:
                return { rawtext: [{ text: '§i' }, { translate: 'rules.infoDisplay.moonPhase.waningCrescent' }] };
            case 4:
                return { rawtext: [{ text: '§8' }, { translate: 'rules.infoDisplay.moonPhase.new' }] };
            case 5:
                return { rawtext: [{ text: '§i' }, { translate: 'rules.infoDisplay.moonPhase.waxingCrescent' }] };
            case 6:
                return { rawtext: [{ text: '§7' }, { translate: 'rules.infoDisplay.moonPhase.lastQuarter' }] };
            case 7:
                return { rawtext: [{ text: '§h' }, { translate: 'rules.infoDisplay.moonPhase.waxingGibbous' }] };
            default:
                return '§4Unknown';
        }
    }
}

export default MoonPhase;