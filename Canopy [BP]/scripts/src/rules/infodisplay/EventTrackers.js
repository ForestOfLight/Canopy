import InfoDisplayElement from './InfoDisplayElement.js';
import { getAllTrackerInfoString } from 'src/commands/trackevent';

class EventTrackers extends InfoDisplayElement {
    constructor(displayLine) {
        const ruleData = { identifier: 'eventTrackers', description: { translate: 'rules.infoDisplay.eventTrackers' } };
        super(ruleData, displayLine, true);
    }

    getFormattedDataOwnLine() {
        return { text: getAllTrackerInfoString().join('\n') };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }
}

export default EventTrackers;