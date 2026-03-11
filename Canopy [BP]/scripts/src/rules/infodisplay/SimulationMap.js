import { world } from '@minecraft/server';
import { InfoDisplayTextElement } from './InfoDisplayTextElement.js';
import { getConfig, getLoadedChunksMessage } from '../../commands/simmap.js';

class SimulationMap extends InfoDisplayTextElement {
    player;

    constructor(player, displayLine) {
        const ruleData = { identifier: 'simulationMap', description: { translate: 'rules.infoDisplay.simulationMap' } };
        super(ruleData, displayLine);
        this.player = player;
    }

    getFormattedDataOwnLine() {
        const config = getConfig(this.player);
        if (config.isLocked) {
            const dimension = world.getDimension(config.dimension);
            return getLoadedChunksMessage(dimension, config.location, config.distance);
        }
        return getLoadedChunksMessage(this.player.dimension, this.player.location, config.distance);
        
    }

    getFormattedDataSharedLine() {
        return { text: `§cSimulationMap should always be on its own InfoDisplay line.§r` };
    }
}

export default SimulationMap;
