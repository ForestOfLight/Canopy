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
        return { text: this.getFormattedPlayerSpeed() };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }

    getFormattedPlayerSpeed() {
        const speed = Vector.from(this.player.getVelocity());
        const blocksPerTick = speed.length;
        const blocksPerSecond = blocksPerTick * TicksPerSecond;
        return `§7${blocksPerSecond.toFixed(3)} m/s`;
    }
}