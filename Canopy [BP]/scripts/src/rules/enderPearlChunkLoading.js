import { getEntitiesByType } from "../../include/utils";
import { GlobalRule, IntegerRule } from "../../lib/canopy/Canopy";
import { world } from '@minecraft/server';

class EnderPearlChunkLoading extends IntegerRule {
    constructor() {
        super(GlobalRule.morphOptions({
            identifier: 'enderPearlChunkLoading',
            onModifyCallback: (newValue) => this.tryStartTicking(newValue),
            defaultValue: -1,
            valueRange: { range: { min: 2, max: 6 }, other: [-1] }
        }));
        this.onEntityAppearBound = this.onEntityAppear.bind(this);
    }

    tryStartTicking(newValue) {
        if (newValue === -1) {
            this.unsubscribeFromEvents();
            this.disableAllTickingPearls();
        } else {
            this.subscribeToEvents();
            this.enableAllTickingPearls();
        }
    }

    subscribeToEvents() {
        world.afterEvents.entitySpawn.subscribe(this.onEntityAppearBound);
        world.afterEvents.entityLoad.subscribe(this.onEntityAppearBound);
    }

    unsubscribeFromEvents() {
        world.afterEvents.entitySpawn.unsubscribe(this.onEntityAppearBound);
        world.afterEvents.entityLoad.unsubscribe(this.onEntityAppearBound);
    }

    onEntityAppear(event) {
        const pearl = event.entity;
        if (pearl?.typeId !== 'minecraft:ender_pearl')
            return;
        this.startTicking(pearl);
    }

    enableAllTickingPearls() {
        getEntitiesByType('minecraft:ender_pearl').forEach(pearl => {
            this.startTicking(pearl);
        });
    }

    disableAllTickingPearls() {
        getEntitiesByType('minecraft:ender_pearl').forEach(pearl => {
            this.safelyTriggerEvent(pearl, 'canopy:stop_ticking');
        });
    }

    startTicking(pearl) {
        const chunkRadiusToTick = this.getNativeValue();
        const eventName = `canopy:start_ticking_r${chunkRadiusToTick}`;
        this.safelyTriggerEvent(pearl, eventName);
    }

    safelyTriggerEvent(pearl, eventName) {
        try {
            pearl?.triggerEvent(eventName);
        } catch(error) {
            if (error.includes(`${eventName} does not exist on minecraft:ender_pearl`))
                throw new Error(`[Canopy] ${eventName} could not be triggered on minecraft:ender_pearl. Are you using another pack that overrides ender pearls?`);
        }
    }
}

export const enderPearlChunkLoading = new EnderPearlChunkLoading();