import { world } from '@minecraft/server';

const Entities = {
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
        for (let dimensionId of dimensionIds) {
            dimensionEntities[dimensionId] = world.getDimension(dimensionId).getEntities();
        }
    
        totalEntities = dimensionEntities.overworld.length + dimensionEntities.nether.length + dimensionEntities.the_end.length;
        let output = '§7Dimension entities: '
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

export { Entities }