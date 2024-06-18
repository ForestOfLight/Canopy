import * as mc from '@minecraft/server'

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

// Track Entities
const Entities = {
	owEntities: [],
    netherEntities: [],
    endEntities: [],
    owEntityCount: 0,
    netherEntityCount: 0,
    endEntityCount: 0,
    
    getWorldEntities() {
        return this.owEntityCount + this.netherEntityCount + this.endEntityCount;
    },

    getDimensionEntities(dimensionId) {
        switch (dimensionId) {
            case 'minecraft:overworld': return this.owEntityCount;
            case 'minecraft:nether': return this.netherEntityCount;
            case 'minecraft:the_end': return this.endEntityCount;
            default: return 'NA';
        }
    },

    getPlayerRadiusEntities(player, dimensionId, radius) {
        const { x, z } = player.location;
        let dimensionEntities = [];

        switch (dimensionId) {
            case 'minecraft:overworld':
                dimensionEntities = this.owEntities;
                break;
            case 'minecraft:nether':
                dimensionEntities = this.netherEntities;
                break;
            case 'minecraft:the_end':
                dimensionEntities = this.endEntities;
                break;
            default:
                return undefined;
        }

        let count = 0;
        for (const entity of dimensionEntities) {
            try {
                const { x: ex, z: ez } = entity.location;
                const distance = Math.sqrt((x - ex) ** 2 + (z - ez) ** 2);

                if (distance <= radius && entity.isValid()) count++;
            } catch (error) {
                if (error.message.includes('property')) { // Entity has despawned
                    continue;
                }
            }
        }

        return count;
    },
}

mc.system.runInterval(() => {
    const players = mc.world.getAllPlayers();
    let shouldUpdate = false;
	for (const player of players) {
        if (player.getDynamicProperty('entities')) {
            shouldUpdate = true;
            break;
        }
    }
    if (!shouldUpdate) return;

    Entities.owEntities = mc.world.getDimension('overworld').getEntities();
    Entities.netherEntities = mc.world.getDimension('nether').getEntities();
    Entities.endEntities = mc.world.getDimension('the_end').getEntities();
    Entities.owEntityCount = countEntities(Entities.owEntities, true);
    Entities.netherEntityCount = countEntities(Entities.netherEntities, true);
    Entities.endEntityCount = countEntities(Entities.endEntities, true);
}, 100);

export { Entities }