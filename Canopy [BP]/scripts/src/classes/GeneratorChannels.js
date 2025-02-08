import ItemCounterChannels from "./ItemCounterChannels.js";
import GeneratorChannel from "./GeneratorChannel";

class GeneratorChannels extends ItemCounterChannels {
    constructor() {
        super(GeneratorChannel, 'hopperGenerators');
    }

    tryCreateHopperBlockPair(placedBlock) {
        if (this.isHopper(placedBlock)) {
            const potentialWool = placedBlock.above();
            if (this.#isWool(potentialWool)) {
                const color = this.#getColorFromWool(potentialWool);
                this.addHopper(placedBlock, color);
            }
        } else if (this.#isWool(placedBlock)) {
            const potentialHopper = placedBlock.below();
            if (this.isHopper(potentialHopper)) {
                const color = this.#getColorFromWool(placedBlock);
                this.addHopper(potentialHopper, color);
            }
        }
    }

    #getColorFromWool(wool) {
        return wool.typeId.replace('minecraft:', '').replace('_wool', '');
    }

    #isWool(block) {
        return block?.typeId?.slice(-4) === 'wool';
    }

    getAllQueryOutput(useRealTime = false) {
        return super.getAllQueryOutput('commands.generator.query.empty', useRealTime);
    }
}

const generatorChannels = new GeneratorChannels();

export default generatorChannels;