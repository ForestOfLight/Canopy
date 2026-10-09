import { BlockComponentTypes, ButtonState, GameMode, InputButton, system } from "@minecraft/server";
import { BulkMode } from "./Modes/BulkMode";
import { getQuickFillModeConfigFromName } from "./Modes/QuickFillModes";

export class QuickFillPlayer {
    static MODE_DP_IDENTIFIER = 'quickFillModeName';
    #BANNED_CONTAINERS = ['minecraft:beacon', 'minecraft:jukebox', 'minecraft:lectern'];
    #mode;
    player;

    constructor(player) {
        this.player = player;
        const ModeClass = this.#getModeClassFromDP();
        this.setMode(ModeClass ?? BulkMode);
    }

    get mode() {
        return this.#mode;
    }

    destroy() {
        this.#mode.destroy();
    }

    setMode(ModeClass) {
        this.#mode?.destroy();
        this.#mode = new ModeClass(this.player);
        this.player.setDynamicProperty(QuickFillPlayer.MODE_DP_IDENTIFIER, this.#mode.name);
    }

    onInteractWithBlock(event) {
        if (this.#BANNED_CONTAINERS.includes(event.block.typeId))
            return;
        const block = event.block;
        const container = this.#getContainer(block);
        if (!container)
            return;
        const heldItemStack = event.itemStack;
        if (heldItemStack === void 0)
            return;
        event.cancel = true;
        if (!event.isFirstEvent)
            return;
        system.run(() => {
            if (this.#isSneaking() && this.player.getGameMode() === GameMode.Creative) {
                container.clearAll();
                this.player.onScreenDisplay.setActionBar({ rawtext: [{ translate: 'rules.quickFillContainer.cleared', with: { rawtext: [{ translate: block.localizationKey }] } }]});
            } else if (this.#isSneaking()) {
                this.#mode.onTakeInteraction(container, heldItemStack, block.localizationKey);
            } else {
                this.#mode.onFillInteraction(container, heldItemStack, block.localizationKey);
            }
        });
    }

    onBreakBlock(event) {
        if (this.player.getGameMode() !== GameMode.Creative)
            return;
        if (this.#BANNED_CONTAINERS.includes(event.block.typeId))
            return;
        const block = event.block;
        const container = this.#getContainer(block);
        if (!container)
            return;
        if (event.itemStack === void 0)
            return;
        if (this.#mode.hasConfigureInteraction()) {
            event.cancel = true;
            system.run(() => {
                this.#mode.onConfigureInteraction(container, block.localizationKey)
            });
        }
    }

    onStartBreakingBlock(event) {
        if (this.player.getGameMode() === GameMode.Creative)
            return;
        if (this.#BANNED_CONTAINERS.includes(event.block.typeId))
            return;
        const block = event.block;
        const container = this.#getContainer(block);
        if (!container)
            return;
        if (event.heldItemStack === void 0)
            return;
        if (this.#mode.hasConfigureInteraction())
            this.#mode.onConfigureInteraction(container, block.localizationKey);
    }

    #getContainer(block) {
        return block?.getComponent(BlockComponentTypes.Inventory)?.container;
    }

    #isSneaking() {
        return this.player.inputInfo.getButtonState(InputButton.Sneak) === ButtonState.Pressed;
    }

    #getModeClassFromDP() {
        const modeName = this.player.getDynamicProperty(QuickFillPlayer.MODE_DP_IDENTIFIER);
        const modeConfig = getQuickFillModeConfigFromName(modeName);
        return modeConfig?.class;
    }
}