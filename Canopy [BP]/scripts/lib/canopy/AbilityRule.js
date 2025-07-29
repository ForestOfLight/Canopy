import { GlobalRule } from "./GlobalRule";
import { EntityComponentTypes, system, world } from "@minecraft/server";

const DEFAULT_ACTION_ITEM = "minecraft:arrow";

export class AbilityRule extends GlobalRule {
    activePlayerIds = new Set();
    playerJoinTick = {};

    constructor(ruleOptions, { slotNumber, actionItem = DEFAULT_ACTION_ITEM, onPlayerEnableCallback = () => {}, onPlayerDisableCallback = () => {} } = {}) {
        super({ ...ruleOptions });
        this.slotNumber = slotNumber;
        this.actionItemId = actionItem;
        this.onPlayerEnable = onPlayerEnableCallback;
        this.onPlayerDisable = onPlayerDisableCallback;
        this.onActionSlotItemChangeBound = this.onActionSlotItemChange.bind(this);
        this.onEnable = this.onEnableWithAdditions(ruleOptions);
        this.onDisable = this.onDisableWithAdditions(ruleOptions);
    }

    onActionSlotItemChange(event) {
        if (!event.player)
            return;
        const player = event.player;
        const options = { isSilent: false };
        if (this.playerJoinTick[player.id] === system.currentTick)
            options.isSilent = true;
        if (event.itemStack?.typeId === this.actionItemId)
            this.enableForPlayer(player, options);
        else if (event.beforeItemStack?.typeId === this.actionItemId)
            this.disableForPlayer(player, options);
    }

    enableForPlayer(player, { isSilent = true } = {}) {
        this.activePlayerIds.add(player?.id);
        if (!isSilent) {
            player.onScreenDisplay.setActionBar({ rawtext: [
                { translate: 'rules.generic.ability' },
                { translate: 'rules.generic.enabled' },
                { text: `§7: ${this.getID()}` }
            ]});
        }
        this.onPlayerEnable(player);
    }

    disableForPlayer(player, { isSilent = true } = {}) {
        this.activePlayerIds.delete(player?.id);
        if (!isSilent) {
            player.onScreenDisplay.setActionBar({ rawtext: [
                { translate: 'rules.generic.ability' },
                { translate: 'rules.generic.disabled' },
                { text: `§7: ${this.getID()}` }
            ]});
        }
        this.onPlayerDisable(player);
    }

    getActionItemId() {
        return this.actionItemId;
    }

    isEnabledForPlayer(player) {
        return this.activePlayerIds.has(player?.id);
    }

    isActionItemInActionSlot(player) {
        const inventory = player.getComponent(EntityComponentTypes.Inventory)?.container;
        const itemStack = inventory.getItem(this.slotNumber);
        return itemStack?.typeId === this.actionItemId;
    }

    refreshOnlinePlayers() {
        world.getAllPlayers().forEach((player) => {
            if (!player)
                return;
            if (this.isActionItemInActionSlot(player) && this.getNativeValue() === true)
                this.enableForPlayer(player);
            else
                this.disableForPlayer(player);
        });
    }
    
    onEnableWithAdditions(ruleOptions) {
        return () => {
            this.refreshOnlinePlayers();
            const itemChangeOptions = { allowedSlots: [this.slotNumber], ignoreQuantityChange: true };
            world.afterEvents.playerInventoryItemChange.subscribe(this.onActionSlotItemChangeBound, itemChangeOptions);
            world.afterEvents.playerJoin.subscribe(this.onPlayerJoin.bind(this));
            world.beforeEvents.playerLeave.subscribe(this.onPlayerLeave.bind(this));
            ruleOptions.onEnableCallback();
        }
    }

    onDisableWithAdditions(ruleOptions) {
        return () => {
            this.refreshOnlinePlayers();
            world.afterEvents.playerInventoryItemChange.unsubscribe(this.onActionSlotItemChangeBound);
            world.afterEvents.playerJoin.unsubscribe(this.onPlayerJoin.bind(this));
            world.beforeEvents.playerLeave.unsubscribe(this.onPlayerLeave.bind(this));
            ruleOptions.onDisableCallback();
        }
    }

    onPlayerJoin(event) {
        this.playerJoinTick[event.playerId] = system.currentTick;
    }

    onPlayerLeave(event) {
        if (!event.player)
            return;
        system.run(() => {
            this.disableForPlayer(event.player);
        });
    }
}