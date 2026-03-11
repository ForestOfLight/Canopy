import { InfoDisplayTextElement } from './InfoDisplayTextElement.js';

class Facing extends InfoDisplayTextElement {
    player;

    constructor(player, displayLine) {
        const ruleData = { identifier: 'facing', description: { translate: 'rules.infoDisplay.facing' } };
        super(ruleData, displayLine);
        this.player = player;
    }

    getFormattedDataOwnLine() {
        const rotation = this.player.getRotation();
	    [ rotation.x, rotation.y ] = [ rotation.x.toFixed(2), rotation.y.toFixed(2) ];
	    return { translate: 'rules.infoDisplay.facing.display', with: [
            '§a' + this.getSignedNumber(rotation.x),
            '§c' + this.getSignedNumber(rotation.y)
        ] };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }

    getSignedNumber(num) {
        const output = Math.abs(num).toFixed(2).padStart(6, '0');
        if (num >= 0)
            return '+' + output;
        return '-' + output;
    }
}

export default Facing;
