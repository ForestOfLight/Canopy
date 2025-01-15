import InfoDisplayElement from './InfoDisplayElement.js';
import { getAllTrackerInfoString } from 'src/commands/trackevent';

class EventTrackers extends InfoDisplayElement {
    constructor() {
        super('eventTrackers', { translate: 'rules.infoDisplay.eventTrackers' }, 9, true);
    }

    getFormattedDataOwnLine() {
        return { text: getAllTrackerInfoString().join('\n') };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }
}

export default EventTrackers;