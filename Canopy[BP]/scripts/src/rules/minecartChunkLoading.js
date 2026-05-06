import { getEntitiesByType } from "../../include/utils";
import { GlobalRule, IntegerRule } from "../../lib/canopy/Canopy";
import { world } from '@minecraft/server';

class MinecartChunkLoading extends IntegerRule {
    constructor() {
        super(GlobalRule.morphOptions({
            identifier: 'minecartChunkLoading',
            wikiDescription: 'Allows minecarts to tick the chunks around them in a square radius for 10 seconds after they are spawned. The minecart must remain present for the full duration. Set to `-1` to disable.',
            suggestedOptions: [-1, 2, 3, 4],
            onModifyCallback: (newValue) => this.tryStartTicking(newValue),
            defaultValue: -1,
            valueRange: { range: { min: 2, max: 6 }, other: [-1] }
        }));
        this.onEntityAppearBound = this.onEntityAppear.bind(this);
    }

    tryStartTicking(newValue) {
        if (newValue === -1) {
            this.unsubscribeFromEvent();
            this.disableAllTickingMinecarts();
        } else {
            this.subscribeToEvent();
        }
    }

    subscribeToEvent() {
        world.afterEvents.entitySpawn.subscribe(this.onEntityAppearBound);
    }

    unsubscribeFromEvent() {
        world.afterEvents.entitySpawn.unsubscribe(this.onEntityAppearBound);
    }

    onEntityAppear(event) {
        const minecart = event.entity;
        if (minecart?.typeId !== 'minecraft:minecart')
            return;
        this.startTicking(minecart);
    }

    disableAllTickingMinecarts() {
        getEntitiesByType('minecraft:minecart').forEach(minecart => {
            this.safelyTriggerEvent(minecart, 'canopy:stop_ticking');
        });
    }

    startTicking(minecart) {
        const chunkRadiusToTick = this.getNativeValue();
        const eventName = `canopy:tick_tenSeconds_r${chunkRadiusToTick}`;
        this.safelyTriggerEvent(minecart, eventName);
    }

    safelyTriggerEvent(minecart, eventName) {
        try {
            minecart?.triggerEvent(eventName);
        } catch(error) {
            if (error.message.includes(`${eventName} does not exist on minecraft:minecart`))
                throw new Error(`[Canopy] ${eventName} could not be triggered on minecraft:minecart. Are you using another pack that overrides minecarts?`);
        }
    }
}

export const minecartChunkLoading = new MinecartChunkLoading();
