import ItemCounterChannels from "./ItemCounterChannels.js";
import CounterChannel from "./CounterChannel";

class CounterChannels extends ItemCounterChannels {
    static init() {
        super.init(CounterChannel, 'hopperCounters');
    }

    static tryCreateHopperBlockPair(placedBlock) {
        if (this.isHopper(placedBlock)) {
            const potentialWool = this.getHopperFacingBlock(placedBlock);
            if (this.#isWool(potentialWool))
                this.addHopper(this.#getColorFromWool(potentialWool), placedBlock);
        } else if (this.#isWool(placedBlock)) {
            const potentialHoppers = [placedBlock.above(), placedBlock.north(), placedBlock.south(), placedBlock.west(), placedBlock.east()];
            for (const potentialHopper of potentialHoppers) {
                if (this.isHopper(potentialHopper) && this.getHopperFacingBlock(potentialHopper)?.typeId === placedBlock.typeId)
                    this.addHopper(this.#getColorFromWool(placedBlock), potentialHopper);
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
        super.getAllQueryOutput('commands.counter.query.empty', useRealTime);
    }
}

CounterChannels.init();

export default CounterChannels;