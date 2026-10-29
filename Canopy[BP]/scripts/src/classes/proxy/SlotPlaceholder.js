import { ItemStack } from "@minecraft/server";

export class SlotPlaceholder {
    static TYPE_ID = "minecraft:barrier";

    static create() {
        return new ItemStack(SlotPlaceholder.TYPE_ID);
    }

    static is(itemStack) {
        return itemStack?.typeId === SlotPlaceholder.TYPE_ID;
    }
}
