import { EntityComponentTypes } from "@minecraft/server";

export class UnderstudyEditorTool {
    static ITEM_IDS = Object.freeze(["minecraft:spyglass", "minecraft:arrow"]);

    static isHeldBy(player) {
        try {
            const container = player?.getComponent(EntityComponentTypes.Inventory)?.container;
            const heldItemStack = container?.getItem(player.selectedSlotIndex);
            return UnderstudyEditorTool.ITEM_IDS.includes(heldItemStack?.typeId);
        } catch {
            return false;
        }
    }
}
