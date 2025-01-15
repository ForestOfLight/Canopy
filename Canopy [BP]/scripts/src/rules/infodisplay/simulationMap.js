import { MinecraftDimensionTypes, world } from '@minecraft/server';
import InfoDisplayElement from './InfoDisplayElement.js';
import getLoadedChunksMessage from '../../commands/simmap.js';

class SimulationMap extends InfoDisplayElement {
    player;
    config;

    constructor(player) {
        super('simulationMap', { translate: 'rules.infoDisplay.simulationMap' }, 11);
        this.player = player;
        this.config = this.getConfig();
    }

    getFormattedDataOwnLine() {
        this.config = this.getConfig();
        if (this.config.isLocked) {
            const dimension = world.getDimension(this.config.dimension);
            return getLoadedChunksMessage(dimension, this.config.location, this.config.distance);
        } else {
            return getLoadedChunksMessage(this.player.dimension, this.player.location, this.config.distance);
        }
    }

    getFormattedDataSharedLine() {
        return { text: `§cSimulationMap should always be on its own InfoDisplay line.§r` };
    }

    getConfig() {
        const dynamicConfig = this.player.getDynamicProperty('simulationMapConfig');
        if (dynamicConfig) {
            return JSON.parse(dynamicConfig);
        }
        const config = {
            isLocked: false,
            dimension: MinecraftDimensionTypes.overworld,
            location: { x: 0, z: 0 },
            distance: 7
        };
        this.player.setDynamicProperty('simulationMapConfig', JSON.stringify(config));
        return config;
    }
}

export default SimulationMap;