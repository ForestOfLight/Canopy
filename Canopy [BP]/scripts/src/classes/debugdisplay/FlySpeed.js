import { ComponentDebugDisplayElement } from './ComponentDebugDisplayElement.js';
import { EntityComponentTypes } from '@minecraft/server';

export class FlySpeed extends ComponentDebugDisplayElement {
    constructor(entity) {
        super(entity, EntityComponentTypes.FlyingSpeed);
    }

    getFormattedData() {
        return `§7${this.component.value}`;
    }
}