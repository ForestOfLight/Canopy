import { ComponentDebugDisplayElement } from './ComponentDebugDisplayElement.js';
import { EntityComponentTypes } from '@minecraft/server';

export class Health extends ComponentDebugDisplayElement {
    constructor(entity) {
        super(entity, EntityComponentTypes.Health);
    }

    getFormattedData() {
        return `§c${this.component.currentValue}/${this.component.defaultValue}§7 (effective: ${this.component.effectiveMin} to ${this.component.effectiveMax})`;
    }
}