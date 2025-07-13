import { ComponentDebugDisplayElement } from './ComponentDebugDisplayElement.js';
import { EntityComponentTypes } from '@minecraft/server';

export class Hunger extends ComponentDebugDisplayElement {
    constructor(entity) {
        super(entity, EntityComponentTypes.Hunger);
    }

    getFormattedData() {
        return `§6${this.component.currentValue}/${this.component.defaultValue} §7(effective: ${this.component.effectiveMin} to ${this.component.effectiveMax})`;
    }
}