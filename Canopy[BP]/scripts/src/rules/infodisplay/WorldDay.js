import { InfoDisplayTextElement } from './InfoDisplayTextElement.js';
import { world } from '@minecraft/server';

export const WORLD_DAY_IDENTIFIER = 'worldDay';

class WorldDay extends InfoDisplayTextElement {
    constructor(displayLine) {
        const ruleData = { identifier: WORLD_DAY_IDENTIFIER, description: { translate: 'rules.infoDisplay.worldDay' }, wikiDescription: 'Shows the count of Minecraft days elapsed since the world was created.' };
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