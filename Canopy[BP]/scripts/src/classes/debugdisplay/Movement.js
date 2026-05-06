import { AttributeDebugDisplayElement } from './AttributeDebugDisplayElement.js';
import { EntityComponentTypes } from '@minecraft/server';

export class Movement extends AttributeDebugDisplayElement {
    constructor(entity) {
        super(entity, EntityComponentTypes.Movement);
    }
}