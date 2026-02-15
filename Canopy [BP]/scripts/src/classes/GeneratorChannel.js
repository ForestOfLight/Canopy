import ItemCounterChannel from "./ItemCounterChannel";
import { world, BlockComponentTypes, ItemStack } from "@minecraft/server";

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
            if (!hopper)
                continue;
            const hopperContainer = hopper.getComponent(BlockComponentTypes.Inventory)?.container;
            const itemStackToClone = hopperContainer?.getItem(0);
            if (itemStackToClone) {
                hopperGenerator.outputItemStack = itemStackToClone;
            } else {
                if (!(hopperGenerator.outputItemStack instanceof ItemStack))
                    continue;
                const generatedItemStack = hopperGenerator.outputItemStack.clone();
                generatedItemStack.amount = 1;
                hopperContainer.setItem(0, generatedItemStack);
                generatedItems.push({ typeId: generatedItemStack.typeId, amount: 1 });
            }
        }
        return generatedItems;
    }
}

export default GeneratorChannel;