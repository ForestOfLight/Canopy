import InfoDisplayElement from './InfoDisplayElement.js';
import { getInfoDisplayOutput } from 'src/commands/counter';

class HopperCounterCounts extends InfoDisplayElement {
    constructor(displayLine) {
        const ruleData = { identifier: 'hopperCounterCounts', description: { translate: 'rules.infoDisplay.hopperCounterCounts' } };
        super(ruleData, displayLine, true);
    }

    getFormattedDataOwnLine() {
        return { text: getInfoDisplayOutput() };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }
}

export default HopperCounterCounts;