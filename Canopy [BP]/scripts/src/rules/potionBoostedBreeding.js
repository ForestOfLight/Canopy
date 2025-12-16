import { EntityComponentTypes, EntityInitializationCause, world } from "@minecraft/server";
import { BooleanRule, GlobalRule } from "../../lib/canopy/Canopy";
import { effectRemoveEvent } from "../events/EffectRemoveEvent";

const VANILLA_MIN_MOVEMENT = 0.1125;
const VANILLA_MAX_MOVEMENT = 0.3375;
const VANILLA_SPEED_MULTIPLIER = 0.2;

export class PotionBoostedBreeding extends BooleanRule {
    constructor() {
        super(GlobalRule.morphOptions({
            identifier: 'potionBoostedBreeding',
            onEnableCallback: () => this.subscribeToEvents(),
            onDisableCallback: () => this.unsubscribeFromEvents()
        }));
        this.onEntitySpawnBound = this.onEntitySpawn.bind(this);
        this.onEffectAddBound = this.onEffectAdd.bind(this);
        this.onEffectRemoveBound = this.onEffectRemove.bind(this);
    }
    
    subscribeToEvents() {
        world.afterEvents.entitySpawn.subscribe(this.onEntitySpawnBound);
        world.afterEvents.effectAdd.subscribe(this.onEffectAddBound);
        effectRemoveEvent.subscribe(this.onEffectRemoveBound);
    }

    unsubscribeFromEvents() {
        world.afterEvents.entitySpawn.unsubscribe(this.onEntitySpawnBound);
        world.afterEvents.effectAdd.unsubscribe(this.onEffectAddBound);
        effectRemoveEvent.unsubscribe(this.onEffectRemoveBound);
    }

    onEntitySpawn(event) {
        if (event.cause !== EntityInitializationCause.Born)
            return;
        this.onEntityBorn(event.entity);
    }

    onEntityBorn(offspring) {
        const nearbyHorses = offspring.dimension.getEntities({ location: offspring.location, type: offspring.typeId, maxDistance: 4, closest: 3 });
        const nearbyAdultHorses = nearbyHorses.filter(nearbyHorse => !nearbyHorse.hasComponent(EntityComponentTypes.IsBaby));
        if (nearbyAdultHorses.length !== 2) {
            console.warn("[Canopy] Could not identify born entity's parents. Skipping.");
            return;
        }
        const offspringValue = this.getBlendedParentAttributes(nearbyAdultHorses[0], nearbyAdultHorses[1]);
        this.setMovementSpeed(offspring, offspringValue);
        offspring.setDynamicProperty('defaultMovementSpeed', offspringValue);
    }

    getBlendedParentAttributes(parentOne, parentTwo) {
        // Verified by code digging BreedableComponent::setOffspringAttributesWithParentCentricBlending()
        // In vanilla, parent values are chosen by defaultValue instead of currentValue.
        const parentOneValue = parentOne.getComponent(EntityComponentTypes.Movement).currentValue;
        const parentTwoValue = parentTwo.getComponent(EntityComponentTypes.Movement).currentValue;
        const avgOfParents = ((parentOneValue + parentTwoValue) / 2);
        const shiftForOffspring = ((Math.random() + Math.random() + Math.random()) / 3 - 0.5) 
            * (Math.abs(parentOneValue - parentTwoValue) + ((VANILLA_MAX_MOVEMENT - VANILLA_MIN_MOVEMENT) * 0.3));
        return avgOfParents + shiftForOffspring;
    }

    onEffectAdd(event) {
        const defaultMovementSpeed = event.entity?.getDynamicProperty('defaultMovementSpeed');
        if (defaultMovementSpeed && event.effect.typeId === "minecraft:speed")
            this.onSpeedAddedToModifiedEntity(event.entity, defaultMovementSpeed, event.effect.amplifier);
    }

    onSpeedAddedToModifiedEntity(entity, defaultMovementSpeed, amplifier) {
        const newMovementSpeed = defaultMovementSpeed * (1 + (VANILLA_SPEED_MULTIPLIER * (amplifier + 1)));
        this.setMovementSpeed(entity, newMovementSpeed);
    }

    onEffectRemove(event) {
        const defaultMovementSpeed = event.entity?.getDynamicProperty('defaultMovementSpeed');
        if (defaultMovementSpeed && event.removedEffect.typeId === "minecraft:speed")
            this.onSpeedRemovedFromModifiedEntity(event.entity, defaultMovementSpeed);
    }

    onSpeedRemovedFromModifiedEntity(entity, defaultMovementSpeed) {
        this.setMovementSpeed(entity, defaultMovementSpeed);
    }

    setMovementSpeed(entity, value) {
        entity.getComponent(EntityComponentTypes.Movement).setCurrentValue(value);
    }
}

export const potionBoostedBreeding = new PotionBoostedBreeding();