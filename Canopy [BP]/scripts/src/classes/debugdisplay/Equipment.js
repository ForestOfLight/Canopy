import { ComponentDebugDisplayElement } from './ComponentDebugDisplayElement.js';
import { EntityComponentTypes } from '@minecraft/server';

export class Equipment extends ComponentDebugDisplayElement {
    constructor(entity) {
        super(entity, EntityComponentTypes.Equippable);
    }

    getFormattedData() {
        return this.relevantProperties.map((prop) => `${prop}: §7${this.component[prop]}`).join('§r\n')
    }
}