import { ComponentDebugDisplayElement } from './ComponentDebugDisplayElement.js';
import { EntityComponentTypes } from '@minecraft/server';

export class IsTamed extends ComponentDebugDisplayElement {
    constructor(entity) {
        super(entity, EntityComponentTypes.IsTamed);
    }

    getFormattedData() {
        this.component = this.entity.getComponent(EntityComponentTypes.IsTamed);
        let isTamed = true;
        if (!this.component?.isValid)
            isTamed = false;
        return `§3${isTamed}`;
    }
}