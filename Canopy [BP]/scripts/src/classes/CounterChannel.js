import ItemCounterChannel from "./ItemCounterChannel";
import { world, ItemStack } from "@minecraft/server";

class CounterChannel extends ItemCounterChannel {
    constructor(color) {
        super(color, `${color}CounterChannel`);
    }

    getQueryOutput(useRealTime = false) {
        super.getQueryOutput('commands.counter.query.channel', useRealTime);
    }

    onTick() {
        super.onTick(() => this.#getItemStacks());
    }

    getAttachedBlockFromHopper(hopper) {
        const facing = hopper.permutation.getState("facing_direction");
        switch (facing) {
            case 0: return hopper.below();
            case 2: return hopper.north();
            case 3: return hopper.south();
            case 4: return hopper.west();
            case 5: return hopper.east();
            default: return undefined;
        }
    }

    #getItemStacks() {
        const countedItems = [];
        for (const hopperCounter of this.hopperList) {
            const hopper = world.getDimension(hopperCounter.dimensionId).getBlock(hopperCounter.location);
            if (!hopper) continue;
    
            const hopperContainer = hopper.getComponent('minecraft:inventory').container;
            const itemStack = hopperContainer?.getItem(0);
            if (!itemStack) continue;
            countedItems.push({ typeId: itemStack.typeId, amount: itemStack.amount });
            hopperContainer.setItem(0, new ItemStack('minecraft:air', 1));
        }
        return countedItems;
    }
}

export default CounterChannel;