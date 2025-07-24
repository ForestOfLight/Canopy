import { InfoDisplayElement } from './InfoDisplayElement.js';
import { Vector } from '../../../lib/Vector.js';

export class Velocity extends InfoDisplayElement {
    player;

    constructor(player, displayLine) {
        const ruleData = {
            identifier: 'velocity',
            description: { translate: 'rules.infoDisplay.velocity' }
        }
        super(ruleData, displayLine);
        this.player = player;
    }

    getFormattedDataOwnLine() {
        return { text: this.getFormattedPlayerVelocity() };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }

    getFormattedPlayerVelocity() {
        const velocity = Vector.from(this.player.getVelocity());
        return `§7${velocity.x.toFixed(3)}, ${velocity.y.toFixed(3)}, ${velocity.z.toFixed(3)} m/gt§r`;
    }
}