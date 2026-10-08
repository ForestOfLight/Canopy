import { EntityComponentTypes, GameMode } from "@minecraft/server";
import { BulkContainer } from "../BulkContainer";
import { ItemClipboard } from "../ItemClipboard";

export class BulkMode {
    player;
    clipboard;

    constructor(player) {
        this.player = player;
        this.playerContainer = player.getComponent(EntityComponentTypes.Inventory)?.container;
        this.clipboard = this.#getBulkClipboard();
    }

    destroy() {}

    #getBulkClipboard() {
        const clipboard = new ItemClipboard();
        const bulkContainer = new BulkContainer();
        clipboard.copy(bulkContainer);
        clipboard.setWildcardTypeId(bulkContainer.getItemTypeId());
        return clipboard;
    }

    onFillInteraction(container, heldItemStack) {
        if (this.player.getGameMode() === GameMode.Creative)
            this.clipboard.insertWithoutCost(container, heldItemStack);
        else
            this.clipboard.transfer(this.playerContainer, container, heldItemStack);
    }

    onGrabInteraction(container, heldItemStack) {
        this.clipboard.transferLikeVanilla(container, this.playerContainer, heldItemStack);
    }

    hasConfigureInteraction() {
        return false;
    }
}