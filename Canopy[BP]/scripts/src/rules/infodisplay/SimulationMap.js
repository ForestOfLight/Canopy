import { world } from '@minecraft/server';
import { InfoDisplayTextElement } from './InfoDisplayTextElement.js';
import { getConfig, getLoadedChunksMessage } from '../../commands/simmap.js';

class SimulationMap extends InfoDisplayTextElement {
    player;

    constructor(player, displayLine) {
        const ruleData = { identifier: 'simulationMap', description: { translate: 'rules.infoDisplay.simulationMap' }, wikiDescription: 'Shows a map of loaded chunks around you or a configured location. Ticking chunks are green; non-ticking chunks are red. Configure with the `./simmap` command. **Warning:** This rule is performance-intensive.' };
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
