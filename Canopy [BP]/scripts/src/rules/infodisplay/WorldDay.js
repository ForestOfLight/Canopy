import InfoDisplayElement from './InfoDisplayElement.js';
import { world } from '@minecraft/server';

class WorldDay extends InfoDisplayElement {
    constructor(displayLine) {
        const ruleData = { identifier: 'worldDay', description: { translate: 'rules.infoDisplay.worldDay' } };
        super(ruleData, displayLine, true);
    }

    getFormattedDataOwnLine() {
        return { translate: 'rules.infoDisplay.worldDay.display', with: [String(world.getDay())] };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }
}

export default WorldDay;