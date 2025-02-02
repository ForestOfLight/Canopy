import ItemCounterChannels from "./ItemCounterChannels.js";
import GeneratorChannel from "./GeneratorChannel";

class GeneratorChannels extends ItemCounterChannels {
    static init() {
        super.init(GeneratorChannel, 'hopperGenerators');
    }

    static tryCreateHopperBlockPair(placedBlock) {
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

    static #getColorFromWool(wool) {
        return wool.typeId.replace('minecraft:', '').replace('_wool', '');
    }

    static #isWool(block) {
        return block?.typeId?.slice(-4) === 'wool';
    }

    static getAllQueryOutput(useRealTime = false) {
        super.getAllQueryOutput('commands.generator.query.empty', useRealTime);
    }
}

GeneratorChannels.init();

export default GeneratorChannels;