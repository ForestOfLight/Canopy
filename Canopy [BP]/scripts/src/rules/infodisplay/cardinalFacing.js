import { InfoDisplayElement } from './InfoDisplayElement.js';

class CardinalFacing extends InfoDisplayElement {
    player;

    constructor(player, displayLine) {
        const ruleData = { identifier: 'cardinalFacing', description: { translate: 'rules.infoDisplay.cardinalFacing' } };
        super(ruleData, displayLine);
        this.player = player;
    }

    getFormattedDataOwnLine() {
        return { translate: 'rules.infoDisplay.cardinalFacing.display', with: [this.getPlayerDirection()] };
    }

    getFormattedDataSharedLine() {
        return { text: `§7${this.getPlayerDirection()}§r` };
    }

    getPlayerDirection() {
		const { x, z } = this.player.getViewDirection();
		const angle = Math.atan2(z, x) * (180 / Math.PI);
	
		if (angle >= -45 && angle < 45) return 'E (+x)'
		else if (angle >= 45 && angle < 135) return 'S (+z)';
		else if (angle >= 135 || angle < -135) return 'W (-x)';
		return 'N (-z)';
	}
}

export default CardinalFacing;