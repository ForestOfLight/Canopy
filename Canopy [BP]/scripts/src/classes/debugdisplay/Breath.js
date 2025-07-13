import { ComponentDebugDisplayElement } from './ComponentDebugDisplayElement.js';
import { EntityComponentTypes } from '@minecraft/server';

export class Breath extends ComponentDebugDisplayElement {
    constructor(entity) {
        super(entity, EntityComponentTypes.Breathable);
    }

    getFormattedData() {
        return super.getFormattedComponent({ valueColorCode: '§b' });
    }
}