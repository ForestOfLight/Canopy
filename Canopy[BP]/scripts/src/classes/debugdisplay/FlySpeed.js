import { ComponentDebugDisplayElement } from './ComponentDebugDisplayElement.js';
import { EntityComponentTypes } from '@minecraft/server';

export class FlySpeed extends ComponentDebugDisplayElement {
    constructor(entity) {
        super(entity, EntityComponentTypes.FlyingSpeed);
    }

    getFormattedData() {
        if (!this.component?.isValid) {
            this.component = this.entity.getComponent(this.componentType);
            return;
        }
        return `§7${this.component.value}`;
    }
}