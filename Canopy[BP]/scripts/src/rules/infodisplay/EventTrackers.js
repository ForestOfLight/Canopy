import { InfoDisplayTextElement } from './InfoDisplayTextElement.js';
import { getAllTrackerInfoString } from '../../commands/trackevent';

export const EVENT_TRACKERS_IDENTIFIER = 'eventTrackers';

class EventTrackers extends InfoDisplayTextElement {
    constructor(displayLine) {
        const ruleData = { identifier: EVENT_TRACKERS_IDENTIFIER, description: { translate: 'rules.infoDisplay.eventTrackers' }, wikiDescription: 'Shows the counts of currently tracked events. Tracking is controlled with `/trackevent`.' };
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