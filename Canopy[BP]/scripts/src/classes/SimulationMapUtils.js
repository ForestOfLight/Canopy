import { DimensionTypes } from "@minecraft/server";

export class SimulationMapUtils {
    static DEFAULT_CHUNK_DISTANCE = 7;

    static getConfig(player) {
        const dynamicConfig = player.getDynamicProperty('simulationMapConfig');
        if (dynamicConfig)
            return JSON.parse(dynamicConfig);

        const config = {
            isLocked: false,
            dimension: DimensionTypes.get('overworld'),
            location: { x: 0, z: 0 },
            distance: SimulationMapUtils.DEFAULT_CHUNK_DISTANCE
        };
        SimulationMapUtils.#saveConfig(player, config);
        return config;
    }

    static setDistance(player, distance) {
        const config = SimulationMapUtils.getConfig(player);
        config.distance = distance;
        SimulationMapUtils.#saveConfig(player, config);
    }

    static setLocation(player, { dimension, x, z }) {
        const config = SimulationMapUtils.getConfig(player);
        config.isLocked = true;
        config.dimension = dimension;
        config.location = { x, z };
        SimulationMapUtils.#saveConfig(player, config);
    }

    static followPlayer(player) {
        const config = SimulationMapUtils.getConfig(player);
        config.isLocked = false;
        config.dimension = player.dimension.id;
        config.location = { x: 0, z: 0 };
        SimulationMapUtils.#saveConfig(player, config);
    }

    static getMapData(dimension, location, distance) {
        const chunkLocation = SimulationMapUtils.#coordsToChunkLocation(location);
        const dimensionChunkLocation = { dimension, ...chunkLocation };
        const loadedChunks = SimulationMapUtils.#getNearbyLoadedChunks(dimensionChunkLocation, distance);

        return {
            dimensionChunkLocation,
            loadedChunkCount: loadedChunks.length,
            map: SimulationMapUtils.#formatVisualChunkMap(loadedChunks, dimensionChunkLocation, distance)
        };
    }

    static getLoadedChunksMessage(dimension, location, distance) {
        return SimulationMapUtils.getMapData(dimension, location, distance).map;
    }

    static #saveConfig(player, config) {
        player.setDynamicProperty('simulationMapConfig', JSON.stringify(config));
    }

    static #coordsToChunkLocation(location) {
        return {
            x: Math.floor(location.x / 16),
            z: Math.floor(location.z / 16)
        };
    }

    static #getNearbyLoadedChunks(dimensionChunkLocation, distance) {
        const loadedChunks = [];
        for (let x = dimensionChunkLocation.x - distance; x <= dimensionChunkLocation.x + distance; x++) {
            for (let z = dimensionChunkLocation.z - distance; z <= dimensionChunkLocation.z + distance; z++) {
                if (SimulationMapUtils.#isChunkLoaded(dimensionChunkLocation.dimension, x, z))
                    loadedChunks.push({ x, z });
            }
        }
        return loadedChunks;
    }

    static #formatVisualChunkMap(loadedChunks, dimensionChunkLocation, distance) {
        const message = { rawtext: [] };
        const loadedSet = new Set(loadedChunks.map(chunk => `${chunk.x},${chunk.z}`));

        for (let x = dimensionChunkLocation.x - distance; x <= dimensionChunkLocation.x + distance; x++) {
            message.rawtext.push({ text: '§7[' });
            for (let z = dimensionChunkLocation.z - distance; z <= dimensionChunkLocation.z + distance; z++) {
                if (loadedSet.has(`${x},${z}`))
                    message.rawtext.push({ text: '§a▒' });
                else
                    message.rawtext.push({ text: '§c▒' });
            }
            message.rawtext.push({ text: '§7]' });
            if (x !== dimensionChunkLocation.x + distance)
                message.rawtext.push({ text: '\n' });
        }

        return message;
    }

    static #isChunkLoaded(dimension, x, z) {
        return dimension.isChunkLoaded({
            x: x * 16,
            y: 100,
            z: z * 16
        });
    }
}
