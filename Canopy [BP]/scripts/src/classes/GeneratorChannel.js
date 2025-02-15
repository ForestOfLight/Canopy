import ItemCounterChannel from "./ItemCounterChannel";
import { world, ItemStack } from "@minecraft/server";

class GeneratorChannel extends ItemCounterChannel {
    constructor(color) {
        super(color, `${color}GeneratorChannel`);
    }

    getQueryOutput(useRealTime = false) {
        return super.getQueryOutput('commands.generator.query.channel', useRealTime);
    }

    onTick() {
        super.onTick(() => this.#generateItems());
    }

    getAttachedBlockFromHopper(hopper) {
        return hopper.above();
    }
    
    #generateItems() {
        const generatedItems = [];
        for (const hopperGenerator of this.hopperList) {
            const hopper = world.getDimension(hopperGenerator.dimensionId).getBlock(hopperGenerator.location);
            if (!hopper) continue;
            const hopperContainer = hopper.getComponent('minecraft:inventory').container;
            const itemStack = hopperContainer?.getItem(0);
            if (itemStack) {
                hopperGenerator.outputItemType = itemStack.typeId;
                hopperGenerator.outputItemAmount = itemStack.amount;
            } else {
                if (hopperGenerator.outputItemType === null)
                    continue;
                hopperContainer.setItem(0, new ItemStack(hopperGenerator.outputItemType));
                generatedItems.push({ typeId: hopperGenerator.outputItemType, amount: 1 });
            }
        }
        return generatedItems;
    }
}

export default GeneratorChannel;