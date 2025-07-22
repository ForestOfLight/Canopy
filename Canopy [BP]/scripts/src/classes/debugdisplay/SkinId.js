import { ComponentDebugDisplayElement } from './ComponentDebugDisplayElement.js';
import { EntityComponentTypes } from '@minecraft/server';

export class SkinId extends ComponentDebugDisplayElement {
    constructor(entity) {
        super(entity, EntityComponentTypes.SkinId);
    }

    getFormattedData() {
        if (!this.component?.isValid) {
            this.component = this.entity.getComponent(this.componentType);
            return;
        }
        return `§7${this.component.value}`;
    }
}