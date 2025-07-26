import { EntityInitializationCause, world } from '@minecraft/server';
import { Event } from './Event';
import { Vector } from '../../lib/Vector';

class SpawnEggSpawnEntityEvent extends Event {
    events = [];
    spawnedEntitiesThisTick = [];
    nearbyToleranceDistance = 2;

    constructor() {
        super();
        this.events = [];
        this.spawnedEntitiesThisTick = [];
    }

    startTrackingEvent() {
        super.startTrackingEvent();
        world.afterEvents.playerInteractWithBlock.subscribe(this.onPlayerInteractWithBlock.bind(this));
        world.afterEvents.entitySpawn.subscribe(this.onEntitySpawn.bind(this));
    }

    provideEvents() {
        const events = [...this.events];
        this.events = [];
        this.spawnedEntitiesThisTick = [];
        return events;
    }

    onPlayerInteractWithBlock(event) {
        if (!event.player || !event.beforeItemStack?.typeId.endsWith('spawn_egg'))
            return;
        const nearbyEntities = this.getNearbyEntities(event.block.location);
        this.events.push({ player: event.player, entity: nearbyEntities[0], block: event.block });
        if (nearbyEntities.length > 1)
            console.warn(`Multiple entities spawned near spawn egg interaction at ${Vector.from(event.block.location)}. Only the first will be processed.`);
    }

    onEntitySpawn(event) {
        if (!event.entity || event.cause !== EntityInitializationCause.Spawned)
            return;
        this.spawnedEntitiesThisTick.push(event.entity);
    }

    getNearbyEntities(location) {
        return this.spawnedEntitiesThisTick.filter(entity => {
            if (!entity?.isValid)
                return false;
            const distance = Vector.from(entity.location).distance(Vector.from(location));
            return distance <= this.nearbyToleranceDistance;
        });
    }

    stopTrackingEvent() {
        super.stopTrackingEvent();
        world.afterEvents.playerInteractWithBlock.unsubscribe(this.onPlayerInteractWithBlock.bind(this));
        world.afterEvents.entitySpawn.unsubscribe(this.onEntitySpawn.bind(this));
    }
}

const spawnEggSpawnEntityEvent = new SpawnEggSpawnEntityEvent();

export { SpawnEggSpawnEntityEvent, spawnEggSpawnEntityEvent };