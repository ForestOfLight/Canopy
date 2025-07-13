import { ComponentDebugDisplayElement } from './ComponentDebugDisplayElement.js';
import { EntityComponentTypes, system, TicksPerSecond } from '@minecraft/server';

export class GrowUp extends ComponentDebugDisplayElement {
    constructor(entity) {
        super(entity, EntityComponentTypes.Ageable);
    }

    getFormattedData() {
        if (!this.component)
            return '';
        const remainingTicks = this.component.duration - (this.entity.getDynamicProperty('spawnTick') - system.currentTick);
        const totalTicks = this.component.duration * TicksPerSecond;
        return `§7${remainingTicks}/${totalTicks} ticks`;
    }
}