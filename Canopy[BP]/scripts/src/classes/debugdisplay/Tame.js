import { DebugDisplayTextElement } from './DebugDisplayTextElement.js';
import { EntityComponentTypes } from '@minecraft/server';
import { getNameFromEntityId } from '../../../include/utils.js';

export class Tame extends DebugDisplayTextElement {
    tameable;
    tameItems;
    isTamed;

    getFormattedData() {
        this.populateComponents();
        if (this.hasIsTamedComponent())
            return this.getTamedText();
        let untamedText = `§3false`;
        if (this.hasTameableComponent())
            untamedText += this.getTameableText();
        return untamedText;
    }
    
    getTamedText() {
        let output = `§3true`;
        const tamedToPlayerId = this.isTamed?.tamedToPlayerId;
        if (tamedToPlayerId !== void 0)
            output += `§7, By: ${getNameFromEntityId(tamedToPlayerId)}`;
        return output;
    }

    getTameableText() {
        const tameItems = this.tameable.getTameItems;
        const tameItemsText = tameItems.length === 0 ? '§7None' : tameItems.map(item => item?.typeId ?? 'Unknown').join(', ');
        return `\n§7Probability: ${this.tameable.probability.toFixed(2)}, Items: ${tameItemsText}`;
    }

    populateComponents() {
        this.tameable = this.entity.getComponent(EntityComponentTypes.Tameable);
        this.isTamed = this.entity.getComponent(EntityComponentTypes.IsTamed);
        if (this.tameable)
            this.tameItems = this.tameable.getTameItems;
    }

    hasIsTamedComponent() {
        return this.isTamed?.isValid;
    }

    hasTameableComponent() {
        return this.tameable?.isValid;
    }
}
