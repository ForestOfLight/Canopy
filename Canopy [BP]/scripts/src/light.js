import { world } from '@minecraft/server'
import Data from 'stickycore/data'

world.afterEvents.playerSpawn.subscribe(event => {
    const player = event.player;
    if (event.initialSpawn || !player.getDynamicProperty('light')) return;
    const dimension = player.dimension;
    LightLevel.lightEntityMap[player.id] = dimension.spawnEntity('canopy:light_level', player.location, { initialPersistence: false });
});

world.beforeEvents.playerLeave.subscribe(event => {
    delete LightLevel.lightEntityMap[event.player.id];
});

const LightLevel = {
    lightEntityMap: {},

    getLightLevel(player) {
        const playerId = player.id;
        const location = player.location;
        const dimension = player.dimension;
        if (!this.lightEntityMap[playerId]) {
            try {
                this.lightEntityMap[playerId] = dimension.spawnEntity('canopy:light_level', location, { initialPersistence: false });
            } catch(error) {
                this.cleanUp();
            }
        }
        
        let lightLevel;
        if (this.lightEntityMap[playerId]) {
            const playerYaw = player.getRotation().y;
            lightLevel = getLightForPlayer(playerId, getPlayerTeleportLocation(playerYaw, location), dimension);
        }
        return lightLevel;
    },

    cleanUp() {
        const lightEntities = Data.getEntitiesByType('canopy:light_level');
        for (const entity of lightEntities) {
            LightLevel.lightEntityMap = LightLevel.lightEntityMap.filter((value, key) => value !== entity);
            try{ 
                entity.remove();
            } catch(error) {
                if (entity.isValid())
                    console.warn(`[Light Level] Failed to remove entity ${entity.id}. Error: ${error.message()}`);
            }
        }
    }
}

function getLightForPlayer(playerId, location, dimension) {
    let lightLevel;
    let entity = LightLevel.lightEntityMap[playerId];

    try {
        entity.teleport(location, { dimension: dimension});
        lightLevel = entity.getProperty('canopy:light');
    } catch(error) {
        try {
            LightLevel.cleanUp();
            LightLevel.lightEntityMap[playerId] = dimension.spawnEntity('canopy:light_level', location, { initialPersistence: false });
            entity = LightLevel.lightEntityMap[playerId];
            lightLevel = entity.getProperty('canopy:light');
        } catch(innerError) {
            LightLevel.cleanUp();
        }
    }
    if (lightLevel === undefined) lightLevel = '?';
    return lightLevel;
}

function getPlayerTeleportLocation(yaw, location) {
    const x = location.x + Math.sin(yaw * Math.PI / 180) * .15;
    const z = location.z - Math.cos(yaw * Math.PI / 180) * .15;
    return { x: x, y: location.y, z: z };
}

LightLevel.cleanUp();

export { LightLevel }