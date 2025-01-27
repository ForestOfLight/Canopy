import InfoDisplayElement from './InfoDisplayElement.js';
import { DataTPS } from 'src/tps';
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
        const tps = DataTPS.tps.toFixed(1);
		return tps >= TicksPerSecond ? `§a${TicksPerSecond}.0` : `§c${tps}`;
	}
}

export default TPS;