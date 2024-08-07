import { system, world } from '@minecraft/server'
import Utils from 'stickycore/utils'

const UPDATE_INTERVAL = 100; // 100 ticks = 5 seconds

// system.runInterval(() => {
//     const shouldUpdate = world.getAllPlayers().some(player => player.getDynamicProperty('entities'));
    
//     if (!shouldUpdate) return;

//     Entities.owEntities = world.getDimension('overworld').getEntities();
//     Entities.netherEntities = world.getDimension('nether').getEntities();
//     Entities.endEntities = world.getDimension('the_end').getEntities();
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
        const dimensionEntities = player.dimension.getEntities();

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
        const viewDirection = Utils.normalizeVector(player.getViewDirection());
        const entities = player.dimension.getEntities({ location: player.location, maxDistance: 96 });

        let count = 0;
        for (const entity of entities) {
            try{
                const toEntity = Utils.normalizeVector(subtractVectors(entity.location, player.location));
                const dotProduct = Utils.dotProduct(viewDirection, toEntity);
                if (dotProduct > 0.4) count++;
            } catch (error) {
                if (error.message.includes('property')) continue; // Entity has despawned
                throw error;
            }
        }
        return count;
    },

    findDenseAreas(dimensionId, gridSize, numResults = 10) {
        const grid = new Map();
        const entities = world.getDimension(dimensionId).getEntities();
    
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

    printDimensionEntities(sender) {
        let dimensionIds = ['overworld', 'nether', 'the_end'];
        let dimensionColors = ['§a', '§c', '§d'];
        let dimensionEntities = {};
        let totalEntities;
        let output = '';
        for (let dimensionId of dimensionIds) {
            dimensionEntities[dimensionId] = world.getDimension(dimensionId).getEntities();
        }
    
        totalEntities = dimensionEntities.overworld.length + dimensionEntities.nether.length + dimensionEntities.the_end.length;
        output = '§7Dimension entities: '
        for (let i = 0; i < dimensionIds.length; i++) {
            let dimensionId = dimensionIds[i];
            let count = dimensionEntities[dimensionId].length;
            let color = dimensionColors[i];
            output += `${color}${count}§r`;
            if (i < dimensionIds.length - 1) output += '/';
            else output += ` §7Total: §f${totalEntities}`;
        }
        
        sender.sendMessage(output);
    },
};

function subtractVectors(vector1, vector2) {
    return {
        x: vector1.x - vector2.x,
        y: vector1.y - vector2.y,
        z: vector1.z - vector2.z,
    };
}

export { Entities }