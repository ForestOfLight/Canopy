import { AttributeDebugDisplayElement } from './AttributeDebugDisplayElement.js';
import { EntityComponentTypes } from '@minecraft/server';

export class Exhaustion extends AttributeDebugDisplayElement {
    constructor(entity) {
        super(entity, EntityComponentTypes.Exhaustion);
    }
}