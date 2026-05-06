import { EntityComponentTypes } from '@minecraft/server';
import { BooleanDebugDisplayElement } from './BooleanDebugDisplayElement.js';

export class WantsJockey extends BooleanDebugDisplayElement {
    getFormattedData() {
        return this.getFormattedBoolean(this.entity.hasComponent(EntityComponentTypes.WantsJockey));
    }
}