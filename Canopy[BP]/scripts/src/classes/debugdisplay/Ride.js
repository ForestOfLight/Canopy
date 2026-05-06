import { ComponentDebugDisplayElement } from './ComponentDebugDisplayElement.js';
import { EntityComponentTypes } from '@minecraft/server';

export class Ride extends ComponentDebugDisplayElement {
    constructor(entity) {
        super(entity, EntityComponentTypes.Rideable);
    }

    getFormattedData() {
        if (!this.component?.isValid) {
            this.component = this.entity.getComponent(this.componentType);
            return;
        }
        const riders = this.component.getRiders();
        const ridersText = riders.length === 0 ? '§7None' : riders.map(rider => rider?.id ?? 'Unknown').join(', ');
        const riderFamilyTypes = this.component.getFamilyTypes();
        const riderFamilyText = riderFamilyTypes.length === 0 ? '§7None' : riderFamilyTypes.join(', ');
        return `\n§7Riders: ${ridersText}` + super.getFormattedComponent({ hide: ['interactText'] }) + `\n§7allowedFamilies: ${riderFamilyText}`;
    }
}