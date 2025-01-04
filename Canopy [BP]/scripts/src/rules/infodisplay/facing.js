import InfoDisplayElement from './InfoDisplayElement.js';

class Facing extends InfoDisplayElement {
    player;

    constructor(player) {
        super('facing', { translate: 'rules.infoDisplay.facing' }, 2);
        this.player = player;
    }

    getFormattedDataOwnLine() {
        let rotation = this.player.getRotation();
	    [ rotation.x, rotation.y ] = [ rotation.x.toFixed(2), rotation.y.toFixed(2) ];
	    return { translate: 'rules.infoDisplay.facing.display', with: [rotation.x, rotation.y] };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }
}

export default Facing;