import { InfoDisplayElement } from './InfoDisplayElement.js';
import { Profiler } from '../../classes/Profiler.js';
import { TicksPerSecond } from '@minecraft/server';

class TPS extends InfoDisplayElement {
    constructor(displayLine) {
        const ruleData = { identifier: 'tps', description: { translate: 'rules.infoDisplay.tps' } };
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