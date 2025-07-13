import { AttributeDebugDisplayElement } from './AttributeDebugDisplayElement.js';
import { EntityComponentTypes } from '@minecraft/server';

export class Health extends AttributeDebugDisplayElement {
    constructor(entity) {
        super(entity, EntityComponentTypes.Health);
    }
}