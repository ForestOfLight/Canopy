import { ComponentDebugDisplayElement } from './ComponentDebugDisplayElement.js';
import { EntityComponentTypes, system, TicksPerSecond } from '@minecraft/server';

export class Item extends ComponentDebugDisplayElement {
    constructor(entity) {
        super(entity, EntityComponentTypes.Item);
        this.spawnTick = this.entity.getDynamicProperty('spawnTick');
    }

    getFormattedData() {
        if (!this.component?.isValid) {
            this.component = this.entity.getComponent(this.componentType);
            return;
        }
        const itemStack = this.component.itemStack;
        const age = system.currentTick - this.spawnTick;
        const ticksToDespawn = TicksPerSecond * 60 * 5;
        const despawnTime = Math.max(0, ticksToDespawn - age);
        return `§a${itemStack.typeId} §2x${itemStack.amount}\n§7(despawn in §2${despawnTime} ticks§7)`;
    }
}