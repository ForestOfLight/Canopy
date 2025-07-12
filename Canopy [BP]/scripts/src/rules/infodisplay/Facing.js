import { InfoDisplayElement } from './InfoDisplayElement.js';

class Facing extends InfoDisplayElement {
    player;

    constructor(player, displayLine) {
        const ruleData = { identifier: 'facing', description: { translate: 'rules.infoDisplay.facing' } };
        super(ruleData, displayLine);
        this.player = player;
    }

    getFormattedDataOwnLine() {
        const rotation = this.player.getRotation();
	    [ rotation.x, rotation.y ] = [ rotation.x.toFixed(2), rotation.y.toFixed(2) ];
	    return { translate: 'rules.infoDisplay.facing.display', with: [rotation.x, rotation.y] };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }
}

export default Facing;
