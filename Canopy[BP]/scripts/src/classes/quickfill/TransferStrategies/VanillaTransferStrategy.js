import { InventoryUtils } from "../../InventoryUtils";
import { TransferStrategy } from "./TransferStrategy";

export class VanillaTransferStrategy extends TransferStrategy {
    static put(container, slotIndex, itemStack) {
        return InventoryUtils.addItemLikeVanilla(container, itemStack);
    }
}
