import { DebugDisplayTextElement } from './DebugDisplayTextElement.js';
import { EntityComponentTypes, world } from '@minecraft/server';
import { getNameFromEntityId } from '../../../include/utils.js';

export class Tame extends DebugDisplayTextElement {
    tameable;
    tameMount;
    tameItems;
    tamedToPlayerIdCache;

    static DP_ID = 'tamedToEntityId';

    constructor(entity) {
        super(entity);
        this.tryPortDPToNewUpdate();
        this.tamedToPlayerIdCache = this.entity.getDynamicProperty(Tame.DP_ID);
    }

    getFormattedData() {
        this.updateTamedToPlayerIdCache();
        this.populateComponents();
        if (this.hasIsTamedComponent())
            return this.getTamedText();
        let untamedText = `§3false`;
        if (this.hasPlayerIdProperty())
            untamedText += this.getTamedToPlayerIdText();
        if (this.hasTameableComponent())
            untamedText += this.getTameableText();
        return untamedText;
    }
    
    getTamedText() {
        let output = `§3true`;
        if (this.tamedToPlayerIdCache)
            output += `§7, By: ${getNameFromEntityId(this.tamedToPlayerIdCache)}`;
        else if (this.isTamed?.tamedToPlayerId !== void 0)
            output += `§7, By: ${getNameFromEntityId(this.isTamed.tamedToPlayerId)}`;
        return output;
    }

    getTamedToPlayerIdText() {
        return `§7, By: ${getNameFromEntityId(this.tamedToPlayerIdCache || this.isTamed?.tamedToPlayerId) ?? 'None'}`;
    }

    getTameableText() {
        const tameItems = this.tameable.getTameItems;
        const tameItemsText = tameItems.length === 0 ? '§7None' : tameItems.map(item => item?.typeId ?? 'Unknown').join(', ');
        return `\n§7Probability: ${this.tameable.probability.toFixed(2)}, Items: ${tameItemsText}`;
    }

    populateComponents() {
        this.tameable = this.entity.getComponent(EntityComponentTypes.Tameable);
        this.tameMount = this.entity.getComponent(EntityComponentTypes.TameMount);
        this.isTamed = this.entity.getComponent(EntityComponentTypes.IsTamed);
        if (this.tameable)
            this.tameItems = this.tameable.getTameItems;
    }

    updateTamedToPlayerIdCache() {
        const playerId = this.tamedToPlayerIdCache || this.entity.getDynamicProperty(Tame.DP_ID);
        this.tamedToPlayerIdCache = playerId;
    }

    hasIsTamedComponent() {
        return this.isTamed?.isValid;
    }

    hasPlayerIdProperty() {
        return this.tameMount?.isValid || this.tameable?.isValid || this.tamedToPlayerIdCache || (this.isTamed?.isValid && this.isTamed?.tamedToPlayerId);
    }

    hasTameableComponent() {
        return this.tameable?.isValid;
    }

    tryPortDPToNewUpdate() {
        const tamedToPlayerId = this.entity.getDynamicProperty('tamedToPlayerId');
        if (tamedToPlayerId) {
            this.entity.setDynamicProperty(Tame.DP_ID, tamedToPlayerId);
            this.entity.setDynamicProperty('tamedToPlayerId', void 0);
        }
    }

    static onEntityTamed(event) {
        if (!event.tamingEntity || !event.entity)
            return;
        event.entity.setDynamicProperty(Tame.DP_ID, event.tamingEntity.id);
    }
}

world.afterEvents.entityTamed.subscribe(Tame.onEntityTamed);