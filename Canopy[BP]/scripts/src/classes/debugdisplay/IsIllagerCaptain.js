import { ComponentDebugDisplayElement } from './ComponentDebugDisplayElement.js';
import { EntityComponentTypes } from '@minecraft/server';

export class IsIllagerCaptain extends ComponentDebugDisplayElement {
    constructor(entity) {
        super(entity, EntityComponentTypes.IsIllagerCaptain);
    }

    getFormattedData() {
        this.component = this.entity.getComponent(EntityComponentTypes.IsIllagerCaptain);
        let isIllagerCaptain = true;
        if (!this.component?.isValid)
            isIllagerCaptain = false;
        return `§3${isIllagerCaptain}`;
    }
}