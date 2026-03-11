import { InfoDisplayTextElement } from './InfoDisplayTextElement.js';
import { world } from '@minecraft/server';

class WorldDay extends InfoDisplayTextElement {
    constructor(displayLine) {
        const ruleData = { identifier: 'worldDay', description: { translate: 'rules.infoDisplay.worldDay' } };
        super(ruleData, displayLine, true);
    }

    getFormattedDataOwnLine() {
        return { translate: 'rules.infoDisplay.worldDay.display', with: ['§b' + world.getDay()] };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }
}

export default WorldDay;