import { DebugDisplayTextElement } from './DebugDisplayTextElement.js';
import { EntityComponentTypes } from '@minecraft/server';

const UNITS_TO_MPS = 44.05289;

export class Horse extends DebugDisplayTextElement {
    speedCalcTypes = ['horse', 'donkey', 'mule'];

    constructor(entity) {
        super(entity);
        this.movementComponent = entity.getComponent(EntityComponentTypes.Movement);
        this.healthComponent = entity.getComponent(EntityComponentTypes.Health);
    }

    getFormattedData() {
        if (!this.speedCalcTypes.includes(this.entity.typeId.replace("minecraft:", "")))
            return 'n/a';
        return `§7Speed: §a${this.movementComponent.currentValue * UNITS_TO_MPS} m/s§7, Health: §c${this.healthComponent.effectiveMax}`;
    }
}