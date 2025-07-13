import { ComponentDebugDisplayElement } from './ComponentDebugDisplayElement.js';
import { EntityComponentTypes } from '@minecraft/server';

export class Item extends ComponentDebugDisplayElement {
    constructor(entity) {
        super(entity, EntityComponentTypes.Item);
    }

    getFormattedData() {
        if (!this.component?.isValid) {
            this.component = this.entity.getComponent(this.componentType);
            return;
        }
        const itemStack = this.component.itemStack;
        return `§a${itemStack.typeId} x${itemStack.amount}`;
    }
}