import { AttributeDebugDisplayElement } from './AttributeDebugDisplayElement.js';
import { EntityComponentTypes } from '@minecraft/server';

export class LavaMovement extends AttributeDebugDisplayElement {
    constructor(entity) {
        super(entity, EntityComponentTypes.LavaMovement);
    }
}