import { InfoDisplayTextElement } from './InfoDisplayTextElement.js';
import { getAllTrackerInfoString } from '../../commands/trackevent';

class EventTrackers extends InfoDisplayTextElement {
    static getRuleIdentifier() {
        return 'eventTrackers';
    }

    constructor(displayLine) {
        const ruleData = { description: { translate: 'rules.infoDisplay.eventTrackers' }, wikiDescription: 'Shows the counts of currently tracked events. Tracking is controlled with `/trackevent`.' };
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