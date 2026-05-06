import { AttributeDebugDisplayElement } from './AttributeDebugDisplayElement.js';
import { EntityComponentTypes } from '@minecraft/server';

export class UnderwaterMovement extends AttributeDebugDisplayElement {
    constructor(entity) {
        super(entity, EntityComponentTypes.UnderwaterMovement);
    }
}