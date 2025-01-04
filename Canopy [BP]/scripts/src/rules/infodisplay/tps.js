import InfoDisplayElement from './InfoDisplayElement.js';
import { DataTPS } from 'src/tps';

class TPS extends InfoDisplayElement {
    constructor() {
        super('tps', { translate: 'rules.infoDisplay.tps' }, 3, true);
    }

    getFormattedDataOwnLine() {
        return { translate: 'rules.infoDisplay.tps.display', with: [this.getTPS()] };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }

    getTPS() {
		return DataTPS.tps >= 20 ? `§a20.0` : `§c${DataTPS.tps.toFixed(1)}`;
	}
}

export default TPS;