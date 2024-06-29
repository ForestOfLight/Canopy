import * as mc from '@minecraft/server'
import Utils from 'stickycore/utils'

const UPDATE_INTERVAL = 100; // 100 ticks = 5 seconds

// mc.system.runInterval(() => {
//     const shouldUpdate = mc.world.getAllPlayers().some(player => player.getDynamicProperty('entities'));
    
//     if (!shouldUpdate) return;

//     Entities.owEntities = mc.world.getDimension('overworld').getEntities();
//     Entities.netherEntities = mc.world.getDimension('nether').getEntities();
//     Entities.endEntities = mc.world.getDimension('the_end').getEntities();
//     Entities.owEntityCount = countEntities(Entities.owEntities, true);
//     Entities.netherEntityCount = countEntities(Entities.netherEntities, true);
//     Entities.endEntityCount = countEntities(Entities.endEntities, true);
// }, UPDATE_INTERVAL);

const Entities = {
	owEntities: [],
    netherEntities: [],
    endEntities: [],
    owEntityCount: 0,
    netherEntityCount: 0,
    endEntityCount: 0,

    getWorldEntities() {
        return this.owEntities.concat(this.netherEntities, this.endEntities);
    },
    
    getWorldEntityCount() {
        return this.owEntityCount + this.netherEntityCount + this.endEntityCount;
    },

    getDimensionEntities(dimensionId) {
        switch (dimensionId) {
            case 'minecraft:overworld': return this.owEntities;
            case 'minecraft:nether': return this.netherEntities;
            case 'minecraft:the_end': return this.endEntities;
            default: return 'NA';
        }
    },

    getDimensionEntityCount(dimensionId) {
        switch (dimensionId) {
            case 'minecraft:overworld': return this.owEntityCount;
            case 'minecraft:nether': return this.netherEntityCount;
            case 'minecraft:the_end': return this.endEntityCount;
            default: return 'NA';
        }
    },

    getPlayerRadiusEntityCount(player, radius) {
        const { x, z } = player.location;
        const dimensionEntities = this.getDimensionEntities(player.dimension.id);

        let count = 0;
        for (const entity of dimensionEntities) {
            try {
                const { x: ex, z: ez } = entity.location;
                const distance = Math.sqrt((x - ex) ** 2 + (z - ez) ** 2);

                if (distance <= radius && entity.isValid()) count++;
            } catch (error) {
                if (error.message.includes('property')) continue; // Entity has despawned
                else console.warn(error.message);
            }
        }

        return count;
    },

    getEntitiesOnScreenCount(player) { // author: jeanmajid
        const vd = normalizeVector(player.getViewDirection());
        const entities = player.dimension.getEntities();

        let count = 0;
        for (const entity of entities) {
            try{
                const distance = Utils.calcDistance(player.location, entity.location, false);
                const toEntity = normalizeVector(subtractVectors(entity.location, player.location));
                const dotProduct = vd.x * toEntity.x + vd.y * toEntity.y + vd.z * toEntity.z;
                if (dotProduct > 0.4 && distance < 256) count++;
            } catch (error) {
                if (error.message.includes('property')) continue; // Entity has despawned
                else console.warn(error.message);
            }
        }
        return count;
    },

    findDenseAreas(dimensionId, gridSize, numResults = 10) {
        const grid = new Map();
        const entities = mc.world.getDimension(dimensionId).getEntities();
    
        for (const entity of entities) {
            try{
                const cellX = Math.floor(entity.location.x / gridSize);
                const cellZ = Math.floor(entity.location.z / gridSize);
                const key = `${cellX},${cellZ}`;
        
                grid.set(key, (grid.get(key) || 0) + 1);
            } catch {}
        }
        const sortedCells = Array.from(grid)
            .map(([key, count]) => ({ key, count }))
            .sort((a, b) => b.count - a.count);
    
        return sortedCells.slice(0, numResults).map(cell => ({
            ...cell,
            coordinates: cell.key.split(',').map(Number),
            gridSize
        }));
    },
}

function countEntities(entities, checkValid) {
    if (!checkValid) {
        return entities.length;
    }

    let count = 0;
    for (const entity of entities) {
        if (!entity.isValid()) continue;
        count++;
    }
    return count;
}

function subtractVectors(vector1, vector2) {
    return {
        x: vector1.x - vector2.x,
        y: vector1.y - vector2.y,
        z: vector1.z - vector2.z,
    };
}

function normalizeVector(vector) {
    const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
    return {
        x: vector.x / length,
        y: vector.y / length,
        z: vector.z / length,
    };
}

export { Entities }