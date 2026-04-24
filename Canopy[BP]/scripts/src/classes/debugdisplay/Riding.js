import { ComponentDebugDisplayElement } from './ComponentDebugDisplayElement.js';
import { EntityComponentTypes } from '@minecraft/server';

export class Riding extends ComponentDebugDisplayElement {
    constructor(entity) {
        super(entity, EntityComponentTypes.Riding);
    }

    getFormattedData() {
        if (!this.component?.isValid) {
            this.component = this.entity.getComponent(this.componentType);
            return;
        }
        return super.getFormattedComponent({ noLinebreak: true });
    }
}