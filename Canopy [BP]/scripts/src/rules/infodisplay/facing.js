import InfoDisplayElement from './infoDisplayElement.js';

class Facing extends InfoDisplayElement {
    player;

    constructor(player) {
        this.player = player;
        super('facing', { translate: 'rules.infoDisplay.facing' }, 2);
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