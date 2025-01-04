import InfoDisplayElement from './InfoDisplayElement.js';

class Coords extends InfoDisplayElement {
    player;

    constructor(player) {
        super('coords', { translate: 'rules.infoDisplay.coords' }, 1);
        this.player = player;
    }

    getFormattedDataOwnLine() {
        let coords = this.player.location;
        [coords.x, coords.y, coords.z] = [coords.x.toFixed(2), coords.y.toFixed(2), coords.z.toFixed(2)];
        return { text: `§r${coords.x} ${coords.y} ${coords.z}§r` };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }
}

export default Coords;