import { DimensionTypes, system, world } from '@minecraft/server';
import { DebugDisplayElement } from './DebugDisplayElement.js';

export class Age extends DebugDisplayElement {
    static entitySpawnTicks = {};

    getFormattedData() {
        let spawnTick = Age.entitySpawnTicks[this.entity.id];
        if (!spawnTick) {
            Age.entitySpawnTicks[this.entity.id] = this.entity.getDynamicProperty('spawnTick');
            spawnTick = Age.entitySpawnTicks[this.entity.id];
        }
        const age = system.currentTick - spawnTick || '?';
        return `§7${age} ticks`;
    }

    static onWorldLoad() {
        const entities = [];
        DimensionTypes.getAll().forEach(dimensionType => {
            const dimension = world.getDimension(dimensionType.typeId);
            entities.push(...dimension.getEntities());
        });
        entities.forEach(entity => {
            if (!entity?.id)
                return;
            const spawnTick = entity.getDynamicProperty('spawnTick');
            if (!Age.entitySpawnTicks[entity.id])
                Age.entitySpawnTicks[entity.id] = spawnTick || system.currentTick;
        });
    }

    static onEntitySpawn(event) {
        const entity = event.entity;
        if (!entity)
            return;
        if (entity && !Age.entitySpawnTicks[entity.id])
            Age.entitySpawnTicks[entity.id] = system.currentTick;
        try {
            entity.setDynamicProperty('spawnTick', system.currentTick);
        } catch (error) {
            if (error.message.includes('Failed to call function'))
                return;
            throw error;
        }
    }

    static onEntityRemove(event) {
        const entity = event.removedEntity;
        if (entity?.id)
            delete Age.entitySpawnTicks[entity.id];
    }

    static onShutdown() {
        Object.keys(Age.entitySpawnTicks).forEach(entityId => {
            const entity = world.getEntity(entityId);
            if (!entity)
                return;
            entity.setDynamicProperty('spawnTick', Age.entitySpawnTicks[entityId]);
        });
    }
}

world.afterEvents.worldLoad.subscribe(Age.onWorldLoad);
world.afterEvents.entitySpawn.subscribe(Age.onEntitySpawn);
world.beforeEvents.entityRemove.subscribe(Age.onEntityRemove);
system.beforeEvents.shutdown.subscribe(Age.onShutdown);