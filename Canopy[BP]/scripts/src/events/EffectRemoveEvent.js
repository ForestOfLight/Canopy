import { DimensionTypes, world } from '@minecraft/server';
import { Event } from './Event';

class EffectRemoveEvent extends Event {
    entityEffectsLastTick = {};
    entityEffectsThisTick = {};

    constructor() {
        super();
        this.entityEffectsLastTick = {};
        this.entityEffectsThisTick = {};
    }

    provideEvents() {
        this.updateEntityEffects();
        return this.getLostEffectEvents();
    }

    updateEntityEffects() {
        this.entityEffectsLastTick = { ...this.entityEffectsThisTick };
        this.entityEffectsThisTick = {};
        this.getWorldEntities().forEach(entity => {
            if (!entity)
                return;
            this.entityEffectsThisTick[entity.id] = entity.getEffects().map(effect => ({ typeId: effect.typeId, amplifier: effect.amplifier }));
        });
    }

    getLostEffectEvents() {
        const lostEffects = [];
        for (const entityId in this.entityEffectsThisTick) {
            const currentEffects = this.entityEffectsThisTick[entityId];
            const lastTickEffects = this.entityEffectsLastTick[entityId];
            const entityLostEffects = this.getLostEffects(currentEffects, lastTickEffects);
            for (const lostEffect of entityLostEffects) {
                lostEffects.push({
                    entity: world.getEntity(entityId),
                    removedEffect: lostEffect
                });
            }
        }
        return lostEffects;
    }

    getLostEffects(currentEffects, lastTickEffects) {
        if (!lastTickEffects || lastTickEffects.length === 0)
            return [];
        if (!currentEffects || currentEffects.length === 0)
            return lastTickEffects;

        const lostEffects = [];
        for (const lastEffect of lastTickEffects) {
            const found = currentEffects.some(cur => {
                if (!cur || !lastEffect)
                    return false;
                if (cur.typeId !== void 0 && lastEffect.typeId !== void 0)
                    return cur.typeId === lastEffect.typeId;
            });
            if (!found)
                lostEffects.push(lastEffect);
        }
        return lostEffects;
    }

    getWorldEntities() {
        const entities = [];
        for (const dimensionId of DimensionTypes.getAll().map(dimensionType => dimensionType.typeId)) {
            const dimension = world.getDimension(dimensionId);
            entities.push(...dimension.getEntities());
        }
        return entities;
    }
}

const effectRemoveEvent = new EffectRemoveEvent();

export { EffectRemoveEvent as EffectRemove, effectRemoveEvent };