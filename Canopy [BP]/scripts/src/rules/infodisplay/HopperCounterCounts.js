import InfoDisplayElement from './InfoDisplayElement.js';
import { getInfoDisplayOutput } from 'src/commands/counter';

class HopperCounterCounts extends InfoDisplayElement {
    constructor() {
        super('hopperCounterCounts', { translate: 'rules.infoDisplay.hopperCounterCounts' }, 9, true);
    }

    getFormattedDataOwnLine() {
        return { text: getInfoDisplayOutput() };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }
}

export default HopperCounterCounts;