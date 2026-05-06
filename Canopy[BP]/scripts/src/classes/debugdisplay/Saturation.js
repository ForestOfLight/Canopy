import { AttributeDebugDisplayElement } from './AttributeDebugDisplayElement.js';
import { EntityComponentTypes } from '@minecraft/server';

export class Saturation extends AttributeDebugDisplayElement {
    constructor(entity) {
        super(entity, EntityComponentTypes.Saturation, '§g');
    }
}