import { InfoDisplayTextElement } from './InfoDisplayTextElement.js';
import { Profiler } from '../../classes/Profiler.js';
import { TicksPerSecond } from '@minecraft/server';

class TPS extends InfoDisplayTextElement {
    static getRuleIdentifier() {
        return 'tps';
    }

    constructor(displayLine) {
        const ruleData = { description: { translate: 'rules.infoDisplay.tps' }, wikiDescription: 'Shows the server\'s current ticks per second (TPS).' };
        super(ruleData, displayLine, true);
    }

    getFormattedDataOwnLine() {
        return { translate: 'rules.infoDisplay.tps.display', with: [this.getTPS()] };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }

    getTPS() {
        const tps = Profiler.tps;
        const nearbyRange = 0.19;
        if (tps >= TicksPerSecond - nearbyRange && tps <= TicksPerSecond + nearbyRange)
            return `§a${TicksPerSecond}.0`;
		return tps >= TicksPerSecond ? `§a${tps.toFixed(1)}` : `§c${tps.toFixed(1)}`;
	}
}

export default TPS;
