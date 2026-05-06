import ItemCounterChannels from "./ItemCounterChannels.js";
import CounterChannel from "./CounterChannel";
import { world } from "@minecraft/server";

class CounterChannels extends ItemCounterChannels {
    constructor() {
        super(CounterChannel, 'hopperCounters');
    }

    tryCreateHopperBlockPair(placedBlock) {
        if (this.isHopper(placedBlock)) {
            const potentialWool = this.getAttachedBlockFromHopper(placedBlock);
            if (this.isWool(potentialWool))
                this.addHopper(placedBlock, this.getColorFromWool(potentialWool));
        } else if (this.isWool(placedBlock)) {
            const potentialHoppers = [placedBlock.above(), placedBlock.north(), placedBlock.south(), placedBlock.west(), placedBlock.east()];
            for (const potentialHopper of potentialHoppers) {
                if (this.isHopper(potentialHopper) && this.getAttachedBlockFromHopper(potentialHopper)?.typeId === placedBlock.typeId)
                    this.addHopper(potentialHopper, this.getColorFromWool(placedBlock));
            }
        }
    }

    getAttachedBlockFromHopper(hopper) {
        const facing = hopper.permutation.getState("facing_direction");
        switch (facing) {
            case 0:
                return hopper.below();
            case 2:
                return hopper.north();
            case 3:
                return hopper.south();
            case 4:
                return hopper.west();
            case 5:
                return hopper.east();
            default:
                return undefined;
        }
    }

    getColorFromWool(wool) {
        return wool.typeId.replace('minecraft:', '').replace('_wool', '');
    }

    isWool(block) {
        return block?.typeId?.slice(-4) === 'wool';
    }

    getAllQueryOutput(useRealTime = false) {
        return super.getAllQueryOutput('commands.counter.query.empty', useRealTime);
    }
}

let counterChannels;
world.afterEvents.worldLoad.subscribe(() => {
    counterChannels = new CounterChannels();
});

export { counterChannels };