import { ButtonState, GameMode, InputButton, system } from "@minecraft/server";
import { BulkMode } from "./Modes/BulkMode";
import { getQuickFillModeConfigFromName } from "./Modes/QuickFillModes";
import { InventoryUtils } from "../InventoryUtils";

export class QuickFillPlayer {
    static MODE_DP_IDENTIFIER = 'quickFillModeName';
    #BANNED_BLOCKS = ['minecraft:beacon', 'minecraft:jukebox', 'minecraft:lectern', 'minecraft:chiseled_bookshelf'];
    #BANNED_ENTITIES = ['minecraft:player'];
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
        if (this.#BANNED_BLOCKS.includes(event.block.typeId))
            return;
        this.#interact(event, event.block, event.isFirstEvent);
    }

    onInteractWithEntity(event) {
        if (this.#BANNED_ENTITIES.includes(event.target.typeId))
            return;
        this.#interact(event, event.target, true);
    }

    onBreakBlock(event) {
        if (this.player.getGameMode() !== GameMode.Creative)
            return;
        if (this.#BANNED_BLOCKS.includes(event.block.typeId))
            return;
        this.#configure(event, event.block);
    }

    onAttackEntity(event) {
        if (this.#BANNED_ENTITIES.includes(event.target.typeId))
            return;
        this.#configure(event, event.target);
    }

    onStartBreakingBlock(event) {
        if (this.player.getGameMode() === GameMode.Creative)
            return;
        if (this.#BANNED_BLOCKS.includes(event.block.typeId))
            return;
        if (event.heldItemStack === void 0 || !this.#mode.hasConfigureInteraction())
            return;
        const block = event.block;
        const container = this.#getContainer(block);
        if (!container)
            return;
        this.#mode.onConfigureInteraction(container, block.localizationKey);
    }

    #interact(event, target, isFirstEvent) {
        const heldItemStack = event.itemStack;
        if (heldItemStack === void 0)
            return;
        const container = this.#getContainer(target);
        if (!container)
            return;
        event.cancel = true;
        if (!isFirstEvent)
            return;
        system.run(() => {
            if (this.#isSneaking() && this.player.getGameMode() === GameMode.Creative) {
                container.clearAll();
                this.player.onScreenDisplay.setActionBar({ rawtext: [{ translate: 'rules.quickFillContainer.cleared', with: { rawtext: [{ translate: target.localizationKey }] } }]});
            } else if (this.#isSneaking()) {
                this.#mode.onTakeInteraction(container, heldItemStack, target.localizationKey);
            } else {
                this.#mode.onFillInteraction(container, heldItemStack, target.localizationKey);
            }
        });
    }

    #configure(event, target) {
        if (event.itemStack === void 0 || !this.#mode.hasConfigureInteraction())
            return;
        const container = this.#getContainer(target);
        if (!container)
            return;
        event.cancel = true;
        system.run(() => {
            this.#mode.onConfigureInteraction(container, target.localizationKey)
        });
    }

    #getContainer(target) {
        return InventoryUtils.getContainer(target);
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