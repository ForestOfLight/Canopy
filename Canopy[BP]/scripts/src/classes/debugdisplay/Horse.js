import { DebugDisplayTextElement } from './DebugDisplayTextElement.js';
import { EntityComponentTypes } from '@minecraft/server';

export const MOVEMENT_UNITS_TO_MPS = 44.05289;

export class Horse extends DebugDisplayTextElement {
    speedCalcTypes = ['horse', 'donkey', 'mule', 'skeleton_horse', 'zombie_horse'];

    constructor(entity) {
        super(entity);
        this.movementComponent = entity.getComponent(EntityComponentTypes.Movement);
        this.healthComponent = entity.getComponent(EntityComponentTypes.Health);
    }

    getFormattedData() {
        if (!this.speedCalcTypes.includes(this.entity.typeId.replace("minecraft:", "")))
            return 'n/a';
        return `§7Speed: §a${this.movementComponent.currentValue * MOVEMENT_UNITS_TO_MPS} m/s§7, Max Health: §c${this.healthComponent.effectiveMax}`;
    }
}