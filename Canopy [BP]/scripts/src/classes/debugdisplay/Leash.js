import { ComponentDebugDisplayElement } from './ComponentDebugDisplayElement.js';
import { EntityComponentTypes } from '@minecraft/server';

export class Leash extends ComponentDebugDisplayElement {
    constructor(entity) {
        super(entity, EntityComponentTypes.Leashable);
    }

    getFormattedData() {
        return super.getFormattedComponent({ hide: ['leashHolderEntityId'] });
    }
}