import InfoDisplayElement from './InfoDisplayElement.js';
import { DataTPS } from 'src/tps';
import { TicksPerSecond } from '@minecraft/server';

const DISPLAY_LINE = 4;

class TPS extends InfoDisplayElement {
    constructor() {
        super('tps', { translate: 'rules.infoDisplay.tps' }, DISPLAY_LINE, true);
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