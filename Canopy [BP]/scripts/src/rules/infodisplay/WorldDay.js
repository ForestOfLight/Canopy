import InfoDisplayElement from './InfoDisplayElement.js';
import { world } from '@minecraft/server';

class WorldDay extends InfoDisplayElement {
    constructor() {
        super('worldDay', { translate: 'rules.infoDisplay.worldDay' }, 5, true);
    }

    getFormattedDataOwnLine() {
        return { translate: 'rules.infoDisplay.worldDay.display', with: [String(world.getDay())] };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }
}

export default WorldDay;