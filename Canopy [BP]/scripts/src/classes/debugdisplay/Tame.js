import { ComponentDebugDisplayElement } from './ComponentDebugDisplayElement.js';
import { EntityComponentTypes } from '@minecraft/server';

export class Tame extends ComponentDebugDisplayElement {
    constructor(entity) {
        super(entity, EntityComponentTypes.Tameable);
    }

    getFormattedData() {
        if (!this.component?.isValid) {
            this.component = this.entity.getComponent(this.componentType);
            return;
        }
        const tameItems = this.component.getTameItems;
        const tameItemsText = tameItems.length === 0 ? '§7None' : tameItems.map(item => item?.typeId ?? 'Unknown').join(', ');
        return `\n§7getTameItems: ${tameItemsText}` + super.getFormattedComponent({ hide: ['getTameItems', 'tamedToPlayerId'] });
    }
}