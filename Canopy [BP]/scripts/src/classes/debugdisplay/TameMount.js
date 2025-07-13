import { ComponentDebugDisplayElement } from './ComponentDebugDisplayElement.js';
import { EntityComponentTypes } from '@minecraft/server';

export class TameMount extends ComponentDebugDisplayElement {
    constructor(entity) {
        super(entity, EntityComponentTypes.TameMount);
    }

    getFormattedData() {
        if (!this.component?.isValid) {
            this.component = this.entity.getComponent(this.componentType);
            return;
        }
        return super.getFormattedComponent({ hide: ['tamedToPlayerId'] });
    }
}