import { InfoDisplayElement } from './InfoDisplayElement.js';
import { Vector } from '../../../lib/Vector.js';
import { TicksPerSecond } from '@minecraft/server';

export class Speed extends InfoDisplayElement {
    player;

    constructor(player, displayLine) {
        const ruleData = {
            identifier: 'speed',
            description: { translate: 'rules.infoDisplay.speed' }
        }
        super(ruleData, displayLine);
        this.player = player;
    }

    getFormattedDataOwnLine() {
        return { text: `§d${this.getPlayerSpeed().toFixed(3)}§r m/s` };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }

    getPlayerSpeed() {
        const speed = Vector.from(this.player.getVelocity());
        const blocksPerTick = speed.length;
        const blocksPerSecond = blocksPerTick * TicksPerSecond;
        return blocksPerSecond;
    }
}