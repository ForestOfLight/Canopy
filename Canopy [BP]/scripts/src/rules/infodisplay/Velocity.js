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
        return `§c${this.getSignedNumber(velocity.x)} §a${this.getSignedNumber(velocity.y)} §b${this.getSignedNumber(velocity.z)}§r m/gt§r`;
    }

    getSignedNumber(num) {
        if (num >= 0)
            return '+' + num.toFixed(3);
        return num.toFixed(3);
    }
}