import { DebugDisplayElement } from './DebugDisplayElement.js';
import { playerTameEntity } from '../../events/PlayerTameEntity.js';
import { EntityComponentTypes } from '@minecraft/server';

export class Tame extends DebugDisplayElement {
    tameable;
    tameMount;
    tameItems;
    tamedToPlayerIdCache;

    constructor(entity) {
        super(entity);
        this.tamedToPlayerIdCache = this.entity.getDynamicProperty('tamedToPlayerId');
    }

    getFormattedData() {
        this.updateTamedToPlayerIdCache();
        this.populateComponents();
        if (this.isTamed())
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
            output += `§7, By: ${this.tamedToPlayerIdCache}`;
        return output;
    }

    getTamedToPlayerIdText() {
        return `§7, By: ${this.tamedToPlayerIdCache ?? 'None'}`;
    }

    getTameableText() {
        const tameItems = this.tameable.getTameItems;
        const tameItemsText = tameItems.length === 0 ? '§7None' : tameItems.map(item => item?.typeId ?? 'Unknown').join(', ');
        return `\n§7Probability: ${this.tameable.probability.toFixed(2)}, Items: ${tameItemsText}`;
    }    

    populateComponents() {
        this.tameable = this.entity.getComponent(EntityComponentTypes.Tameable);
        this.tameMount = this.entity.getComponent(EntityComponentTypes.TameMount);
        if (this.tameable)
            this.tameItems = this.tameable.getTameItems;
    }

    updateTamedToPlayerIdCache() {
        const playerId = this.tamedToPlayerIdCache || this.entity.getDynamicProperty('tamedToPlayerId');
        this.tamedToPlayerIdCache = playerId;
    }

    isTamed() {
        return this.entity.hasComponent(EntityComponentTypes.IsTamed);
    }

    hasPlayerIdProperty() {
        return (this.tameMount && this.tameMount.isValid) || (this.tameable && this.tameable.isValid) || this.tamedToPlayerIdCache;
    }

    hasTameableComponent() {
        return this.tameable && this.tameable.isValid;
    }

    static onPlayerTameEntity(event) {
        if (!event.player || !event.entity)
            return;
        event.entity.setDynamicProperty('tamedToPlayerId', event.player.id);
    }
}

playerTameEntity.subscribe(Tame.onPlayerTameEntity);