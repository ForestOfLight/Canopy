import { DebugDisplayElement } from './DebugDisplayElement.js';
import { Vector } from '../../../lib/Vector.js';
import { TicksPerSecond } from '@minecraft/server';

export class Speed extends DebugDisplayElement {
    getFormattedData() {
        const speed = Vector.from(this.entity.getVelocity());
        const blocksPerTick = speed.length;
        const blocksPerSecond = blocksPerTick * TicksPerSecond;
        return `§7${blocksPerSecond.toFixed(4)} m/s`;
    }
}