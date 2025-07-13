import { ComponentDebugDisplayElement } from './ComponentDebugDisplayElement.js';
import { EntityComponentTypes } from '@minecraft/server';

export class Breath extends ComponentDebugDisplayElement {
    constructor(entity) {
        super(entity, EntityComponentTypes.Breathable);
    }

    getFormattedData() {
        return '\n' + this.relevantProperties.map((prop) => `§7${prop}: §3${this.component[prop]}`).join('§r\n')
    }
}