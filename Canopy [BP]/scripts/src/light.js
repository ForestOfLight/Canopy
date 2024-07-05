import * as mc from '@minecraft/server'
import Data from 'stickycore/data'

mc.world.afterEvents.playerSpawn.subscribe(event => {
    const player = event.player;
    if (event.initialSpawn || !player.getDynamicProperty('light')) return;
    const dimension = player.dimension;
    LightLevel.lightEntityMap[player.id] = dimension.spawnEntity('info:light_level', player.location, { initialPersistence: false });
});

mc.world.beforeEvents.playerLeave.subscribe(event => {
    delete LightLevel.lightEntityMap[event.player.id];
});

const LightLevel = {
    lightEntityMap: {},

    getLightLevel(playerId, location, dimension) {
        if (!this.lightEntityMap[playerId]) {
            try {
                this.lightEntityMap[playerId] = dimension.spawnEntity('info:light_level', location, { initialPersistence: false });
            } catch(error) {
                this.cleanUp();
            }
        }
        
        let lightLevel;
        if (this.lightEntityMap[playerId]) {
            lightLevel = getLightForPlayer(playerId, location, dimension);
        }
        return lightLevel;
    },

    cleanUp() {
        const lightEntities = Data.getEntitiesByType('info:light_level');
        for (const entity of lightEntities) {
            LightLevel.lightEntityMap = {};
            entity.remove();
        }
    }
}

function getLightForPlayer(playerId, location, dimension) {
    let lightLevel;
    let entity = LightLevel.lightEntityMap[playerId];

    try {
        entity.teleport(location, { dimension: dimension});
        lightLevel = entity.getProperty('info:light');
    } catch(error) {
        try {
            LightLevel.cleanUp();
            LightLevel.lightEntityMap[playerId] = dimension.spawnEntity('info:light_level', location, { initialPersistence: false });
            entity = LightLevel.lightEntityMap[playerId];
            lightLevel = entity.getProperty('info:light');
        } catch(innerError) {
            LightLevel.cleanUp();
        }
    }
    if (lightLevel === undefined) lightLevel = '?';
    return lightLevel;
}

export { LightLevel }