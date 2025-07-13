import { AttributeDebugDisplayElement } from './AttributeDebugDisplayElement.js';
import { EntityComponentTypes } from '@minecraft/server';

export class Hunger extends AttributeDebugDisplayElement {
    constructor(entity) {
        super(entity, EntityComponentTypes.Hunger, '§6');
    }
}