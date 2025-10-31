import { InfoDisplayElement } from './InfoDisplayElement.js';

class CardinalFacing extends InfoDisplayElement {
    player;

    constructor(player, displayLine) {
        const ruleData = { identifier: 'cardinalFacing', description: { translate: 'rules.infoDisplay.cardinalFacing' } };
        super(ruleData, displayLine);
        this.player = player;
    }

    getFormattedDataOwnLine() {
        return { translate: 'rules.infoDisplay.cardinalFacing.display', with: [`${this.getPlayerDirection()}§r`] };
    }

    getFormattedDataSharedLine() {
        return { text: `${this.getPlayerDirection()}§r` };
    }

    getPlayerDirection() {
		const { x, z } = this.player.getViewDirection();
		const angle = Math.atan2(z, x) * (180 / Math.PI);
	
		if (angle >= -45 && angle < 45)
            return '§l§cE §r§c(+x)'
		else if (angle >= 45 && angle < 135)
            return '§l§bS §r§b(+z)';
		else if (angle >= 135 || angle < -135)
            return '§l§cW §r§c(-x)';
		return '§l§bN §r§b(-z)';
	}
}

export default CardinalFacing;
