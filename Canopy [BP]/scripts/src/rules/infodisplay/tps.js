import InfoDisplayElement from './infoDisplayElement.js';
import { DataTPS } from 'src/tps';

class TPS extends InfoDisplayElement {
    player;

    constructor(player) {
        this.player = player;
        super('tps', { translate: 'rules.infoDisplay.tps' }, 3);
    }

    getFormattedDataOwnLine() {
        return { translate: 'rules.infoDisplay.tps.display', with: [this.getTPS()] };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }

    getTPS() {
		return tpsData >= 20 ? `§a20.0` : `§c${DataTPS.tps.toFixed(1)}`;
	}
}

export default CardinalFacing;