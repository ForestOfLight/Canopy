import { ComponentDebugDisplayElement } from './ComponentDebugDisplayElement.js';
import { EntityComponentTypes } from '@minecraft/server';

export class Equipment extends ComponentDebugDisplayElement {
    constructor(entity) {
        super(entity, EntityComponentTypes.Equippable);
    }

    getFormattedData() {
        return this.relevantProperties.map((prop) => `§7${prop}: ${this.component[prop]}`).join(', ');
    }
}