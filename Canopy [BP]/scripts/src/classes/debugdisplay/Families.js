import { ComponentDebugDisplayElement } from './ComponentDebugDisplayElement.js';
import { EntityComponentTypes } from '@minecraft/server';

export class Families extends ComponentDebugDisplayElement {
    constructor(entity) {
        super(entity, EntityComponentTypes.TypeFamily);
    }

    getFormattedData() {
        if (!this.component?.isValid) {
            this.component = this.entity.getComponent(this.componentType);
            return;
        }
        const families = this.component.getTypeFamilies();
        return `§7${families.join(', ')}`;
    }
}