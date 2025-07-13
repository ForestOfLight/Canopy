import { ComponentDebugDisplayElement } from './ComponentDebugDisplayElement.js';
import { EntityComponentTypes } from '@minecraft/server';

export class Exhaustion extends ComponentDebugDisplayElement {
    constructor(entity) {
        super(entity, EntityComponentTypes.Exhaustion);
    }

    getFormattedData() {
        return `§7${this.component.currentValue}/${this.component.defaultValue} (effective: ${this.component.effectiveMin} to ${this.component.effectiveMax})`;
    }
}