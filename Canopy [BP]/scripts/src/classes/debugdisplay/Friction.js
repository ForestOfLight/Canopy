import { ComponentDebugDisplayElement } from './ComponentDebugDisplayElement.js';
import { EntityComponentTypes } from '@minecraft/server';

export class Friction extends ComponentDebugDisplayElement {
    constructor(entity) {
        super(entity, EntityComponentTypes.FrictionModifier);
    }

    getFormattedData() {
        return `§7${this.component.value}`;
    }
}