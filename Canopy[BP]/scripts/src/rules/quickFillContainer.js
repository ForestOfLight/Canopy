import { world } from "@minecraft/server";
import { AbilityRule } from "../../lib/canopy/Canopy";
import { QuickFillPlayer } from "../classes/quickfill/QuickFillPlayer";
import { getQuickFillModeConfigFromName } from "../classes/quickfill/Modes/QuickFillModes";

class QuickFillContainer extends AbilityRule {
    #quickFillPlayers = new Map();

    constructor() {
        super({
            identifier: 'quickFillContainer',
            wikiDescription: 'With an arrow in the top left of your inventory (slot 9), interact with a container while holding an item to move matching items into it; sneak to reverse, or sneak + interact with an empty hand to remove all. Use /quickfillmode to customize item movement.',
            onEnableCallback: () => {
                world.beforeEvents.playerInteractWithBlock.subscribe(this.onPlayerInteractWithBlockBound);
                world.beforeEvents.playerBreakBlock.subscribe(this.onPlayerBreakBlockBound);
                world.afterEvents.playerStartBreakingBlock.subscribe(this.onPlayerStartBreakingBlockBound);
            },
            onDisableCallback: () => {
                world.beforeEvents.playerInteractWithBlock.unsubscribe(this.onPlayerInteractWithBlockBound);
                world.beforeEvents.playerBreakBlock.unsubscribe(this.onPlayerBreakBlockBound);
                world.afterEvents.playerStartBreakingBlock.unsubscribe(this.onPlayerStartBreakingBlockBound);
                for (const quickFillPlayer of this.#quickFillPlayers.values())
                    quickFillPlayer.destroy();
                this.#quickFillPlayers.clear();
            }
        }, {
            slotNumber: 9,
            onPlayerEnableCallback: (player) => this.#enableQuickFillPlayer(player),
            onPlayerDisableCallback: (player) => this.#disableQuickFillPlayer(player)
        });
        this.onPlayerInteractWithBlockBound = this.onPlayerInteractWithBlock.bind(this);
        this.onPlayerBreakBlockBound = this.onPlayerBreakBlock.bind(this);
        this.onPlayerStartBreakingBlockBound = this.onPlayerStartBreakingBlock.bind(this);
    }

    onPlayerInteractWithBlock(event) {
        this.getActiveQuickFillPlayer(event.player)?.onInteractWithBlock(event);
    }

    onPlayerBreakBlock(event) {
        this.getActiveQuickFillPlayer(event.player)?.onBreakBlock(event);
    }

    onPlayerStartBreakingBlock(event) {
        this.getActiveQuickFillPlayer(event.player)?.onStartBreakingBlock(event);
    }

    getActiveQuickFillPlayer(player) {
        return this.#quickFillPlayers.get(player?.id);
    }

    setQuickFillPlayerMode(player, modeName) {
        const quickFillPlayer = this.getActiveQuickFillPlayer(player);
        if (quickFillPlayer) {
            const modeConfig = getQuickFillModeConfigFromName(modeName);
            quickFillPlayer.setMode(modeConfig.class);
        } else {
            player.setDynamicProperty(QuickFillPlayer.MODE_DP_IDENTIFIER, modeName);
        }
    }

    #enableQuickFillPlayer(player) {
        if (!this.getActiveQuickFillPlayer(player))
            this.#quickFillPlayers.set(player.id, new QuickFillPlayer(player));
    }

    #disableQuickFillPlayer(player) {
        const quickFillPlayer = this.getActiveQuickFillPlayer(player);
        if (!quickFillPlayer)
            return;
        this.#quickFillPlayers.delete(player.id);
        quickFillPlayer.destroy();
    }
}

export const quickFillContainer = new QuickFillContainer();
