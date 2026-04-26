import { InfoDisplayTextElement } from './InfoDisplayTextElement.js';
import { world } from '@minecraft/server';

class WorldDay extends InfoDisplayTextElement {
    constructor(displayLine) {
        const ruleData = { identifier: 'worldDay', description: { translate: 'rules.infoDisplay.worldDay' }, wikiDescription: 'Shows the count of Minecraft days elapsed since the world was created.' };
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