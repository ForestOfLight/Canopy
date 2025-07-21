import { GlobalRule } from "./GlobalRule";
import { world } from "@minecraft/server";

const DEFAULT_ACTION_ITEM = "minecraft:arrow";

export class AbilityRule extends GlobalRule {
    activePlayerIds = new Set();

    constructor(ruleOptions, { slotNumber, actionItem = DEFAULT_ACTION_ITEM, onPlayerEnableCallback = () => {}, onPlayerDisableCallback = () => {} } = {}) {
        super({ ...ruleOptions });
        this.slotNumber = slotNumber;
        this.actionItemId = actionItem;
        this.onPlayerEnable = onPlayerEnableCallback;
        this.onPlayerDisable = onPlayerDisableCallback;
        this.onActionSlotItemChangeBound = this.onActionSlotItemChange.bind(this);
        const onEnableWithAdditions = () => {
            world.afterEvents.playerInventoryItemChange.subscribe(
                this.onActionSlotItemChangeBound,
                { allowedSlots: [slotNumber], ignoreQuantityChange: true }
            );
            ruleOptions.onEnableCallback();
        };
        const onDisableWithAdditions = () => {
            world.afterEvents.playerInventoryItemChange.unsubscribe(this.onActionSlotItemChangeBound);
            ruleOptions.onDisableCallback();
        };
        this.onEnable = onEnableWithAdditions;
        this.onDisable = onDisableWithAdditions;
    }

    onActionSlotItemChange(event) {
        if (!event.player)
            return;
        if (event.itemStack?.typeId === this.actionItemId)
            this.enableForPlayer(event.player);
        else if (event.beforeItemStack?.typeId === this.actionItemId)
            this.disableForPlayer(event.player);
    }

    enableForPlayer(player) {
        this.activePlayerIds.add(player?.id);
        player.onScreenDisplay.setActionBar({ rawtext: [
            { translate: 'rules.generic.ability' },
            { translate: 'rules.generic.enabled' },
            { text: `§7: ${this.getID()}` }
        ]});
        this.onPlayerEnable(player);
    }

    disableForPlayer(player) {
        this.activePlayerIds.delete(player?.id);
        player.onScreenDisplay.setActionBar({ rawtext: [
            { translate: 'rules.generic.ability' },
            { translate: 'rules.generic.disabled' },
            { text: `§7: ${this.getID()}` }
        ]});
        this.onPlayerDisable(player);
    }

    getActionItemId() {
        return this.actionItemId;
    }

    isEnabledForPlayer(player) {
        return this.activePlayerIds.has(player?.id);
    }
}