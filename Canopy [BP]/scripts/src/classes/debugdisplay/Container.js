import { ComponentDebugDisplayElement } from './ComponentDebugDisplayElement.js';
import { EntityComponentTypes } from '@minecraft/server';

export class Container extends ComponentDebugDisplayElement {
    constructor(entity) {
        super(entity, EntityComponentTypes.Inventory);
    }

    getFormattedData() {
        if (!this.component?.isValid)
            return '';
        const container = this.component.container;
        let message = `§7canBeSiphonedFrom: §3${this.component.canBeSiphonedFrom}`;
        message += `\n§7Filled Slots: ${container.size - container.emptySlotsCount}/${container.size}, Weight: ${container.weight}`;
        return message;
    }
}