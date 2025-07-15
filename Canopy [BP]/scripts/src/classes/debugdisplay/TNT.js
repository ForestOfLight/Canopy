import { DebugDisplayElement } from './DebugDisplayElement.js';
import { commandTntFuse } from '../../rules/commandTntFuse.js';

export class TNT extends DebugDisplayElement {
    totalFuseTicks;

    getFormattedData() {
        if (!this.totalFuseTicks)
            this.totalFuseTicks = commandTntFuse.getGlobalFuseTicks();
        const fuseTicks = this.entity.getDynamicProperty('fuseTicks');
        return `§c${fuseTicks}§7/${this.totalFuseTicks} ticks`;
    }
}