import { BlockComponentTypes, ButtonState, GameMode, InputButton, system } from "@minecraft/server";
import { BulkMode } from "./Modes/BulkMode";

export class QuickFillPlayer {
    #bannedContainers = ['minecraft:beacon', 'minecraft:jukebox', 'minecraft:lectern'];
    player;
    mode;

    constructor(player) {
        this.player = player;
        this.mode = new BulkMode(this.player);
    }

    destroy() {
        this.mode.destroy();
    }

    setMode(ModeClass) {
        this.mode.destroy();
        this.mode = new ModeClass(this.player);
    }

    onInteractWithBlock(event) {
        if (this.#bannedContainers.includes(event.block.typeId))
            return;
        const block = event.block;
        const container = this.#getContainer(block);
        if (!container)
            return;
        const heldItemStack = event.itemStack;
        if (heldItemStack === void 0)
            return;
        event.cancel = true;
        system.run(() => {
            if (this.#isSneaking() && this.player.getGameMode() === GameMode.Creative)
                container.clearAll();
            else if (this.#isSneaking())
                this.mode.onTakeInteraction(container, heldItemStack, block.localizationKey);
            else
                this.mode.onFillInteraction(container, heldItemStack, block.localizationKey);
        });
    }

    onBreakBlock(event) {
        if (this.player.getGameMode() !== GameMode.Creative)
            return;
        if (this.#bannedContainers.includes(event.block.typeId))
            return;
        const block = event.block;
        const container = this.#getContainer(block);
        if (!container)
            return;
        if (event.itemStack === void 0)
            return;
        if (this.mode.hasConfigureInteraction()) {
            event.cancel = true;
            system.run(() => {
                this.mode.onConfigureInteraction(container, block.localizationKey)
            });
        }
    }

    onStartBreakingBlock(event) {
        if (this.player.getGameMode() === GameMode.Creative)
            return;
        if (this.#bannedContainers.includes(event.block.typeId))
            return;
        const block = event.block;
        const container = this.#getContainer(block);
        if (!container)
            return;
        if (this.mode.hasConfigureInteraction())
            this.mode.onConfigureInteraction(container, block.localizationKey);
    }

    #getContainer(block) {
        return block?.getComponent(BlockComponentTypes.Inventory)?.container;
    }

    #isSneaking() {
        return this.player.inputInfo.getButtonState(InputButton.Sneak) === ButtonState.Pressed;
    }
}