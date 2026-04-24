import { describe, it, expect, vi, beforeEach } from "vitest";
import { AbilityRule } from "../../../../../../Canopy[BP]/scripts/lib/canopy/rules/AbilityRule";
import { Rules } from "../../../../../../Canopy[BP]/scripts/lib/canopy/rules/Rules";

vi.mock('@minecraft/server', async (importOriginal) => {
    const original = await importOriginal();
    return {
        ...original,
        world: {
            ...original.world,
            beforeEvents: {
                ...original.world.beforeEvents,
                playerLeave: { subscribe: vi.fn(), unsubscribe: vi.fn() },
            },
            afterEvents: {
                ...original.world.afterEvents,
                playerJoin: { subscribe: vi.fn(), unsubscribe: vi.fn() },
            },
            getAllPlayers: vi.fn().mockReturnValue([]),
        },
        system: {
            ...original.system,
            currentTick: 0,
            run: vi.fn((cb) => cb()),
        }
    };
});

const onPlayerEnableCallback = vi.fn();
const onPlayerDisableCallback = vi.fn();

describe('AbilityRule', () => {
    let abilityRule;
    const testRuleData = {
        category: 'Rules',
        identifier: 'testRule',
        onEnableCallback: vi.fn(),
        onDisableCallback: vi.fn(),
    };

    beforeEach(() => {
        Rules.clear();
        vi.clearAllMocks();
        abilityRule = new AbilityRule(testRuleData, { slotNumber: 1, onPlayerEnableCallback, onPlayerDisableCallback });
    });

    it('should enable when the action item is placed in the correct slot', () => {
        abilityRule.onActionSlotItemChange({
            itemStack: { typeId: 'minecraft:arrow' },
            player: { id: 'player1', onScreenDisplay: { setActionBar: vi.fn() } }
        });
        expect(onPlayerEnableCallback).toHaveBeenCalled();
    });

    it('should disable when the action item is removed from the correct slot', () => {
        abilityRule.onActionSlotItemChange({
            beforeItemStack: { typeId: 'minecraft:arrow' },
            player: { id: 'player1', onScreenDisplay: { setActionBar: vi.fn() } }
        });
        expect(onPlayerDisableCallback).toHaveBeenCalled();
    });

    it('should default to using the arrow for the action item', () => {
        expect(abilityRule.getActionItemId()).toBe('minecraft:arrow');
    });

    it('should use a custom action item if provided', () => {
        const customArrowAbility = new AbilityRule(testRuleData, { slotNumber: 1, actionItem: 'minecraft:other_item' });
        expect(customArrowAbility.getActionItemId()).toBe('minecraft:other_item');
    });

    it('should return early from onActionSlotItemChange when player is null', () => {
        expect(() => abilityRule.onActionSlotItemChange({ player: null })).not.toThrow();
        expect(onPlayerEnableCallback).not.toHaveBeenCalled();
    });

    it('should set isSilent to true when the player joined on the same tick', () => {
        const player = { id: 'player1', onScreenDisplay: { setActionBar: vi.fn() } };
        abilityRule.playerJoinTick['player1'] = 0;
        abilityRule.onActionSlotItemChange({
            itemStack: { typeId: 'minecraft:arrow' },
            player
        });
        expect(player.onScreenDisplay.setActionBar).not.toHaveBeenCalled();
        expect(onPlayerEnableCallback).toHaveBeenCalled();
    });

    it('should track enabled state per player', () => {
        const player = { id: 'player1' };
        abilityRule.enableForPlayer(player);
        expect(abilityRule.isEnabledForPlayer(player)).toBe(true);
        abilityRule.disableForPlayer(player);
        expect(abilityRule.isEnabledForPlayer(player)).toBe(false);
    });

    it('should return true when action item is in the correct slot', () => {
        const player = {
            getComponent: vi.fn().mockReturnValue({
                container: { getItem: vi.fn().mockReturnValue({ typeId: 'minecraft:arrow' }) }
            })
        };
        expect(abilityRule.isActionItemInActionSlot(player)).toBe(true);
    });

    it('should return false when action item is not in the slot', () => {
        const player = {
            getComponent: vi.fn().mockReturnValue({
                container: { getItem: vi.fn().mockReturnValue(null) }
            })
        };
        expect(abilityRule.isActionItemInActionSlot(player)).toBe(false);
    });

    it('should enable players that have the action item in slot when refreshed', async () => {
        const { world } = await import('@minecraft/server');
        const player = {
            id: 'player1',
            getComponent: vi.fn().mockReturnValue({
                container: { getItem: vi.fn().mockReturnValue({ typeId: 'minecraft:arrow' }) }
            }),
            onScreenDisplay: { setActionBar: vi.fn() }
        };
        world.getAllPlayers.mockReturnValue([player]);
        vi.spyOn(abilityRule, 'getNativeValue').mockReturnValue(true);
        abilityRule.refreshOnlinePlayers();
        expect(onPlayerEnableCallback).toHaveBeenCalledWith(player);
    });

    it('should disable players that do not have the action item in slot when refreshed', async () => {
        const { world } = await import('@minecraft/server');
        const player = {
            id: 'player1',
            getComponent: vi.fn().mockReturnValue({
                container: { getItem: vi.fn().mockReturnValue(null) }
            }),
            onScreenDisplay: { setActionBar: vi.fn() }
        };
        world.getAllPlayers.mockReturnValue([player]);
        abilityRule.refreshOnlinePlayers();
        expect(onPlayerDisableCallback).toHaveBeenCalledWith(player);
    });

    it('should skip null players during refresh', async () => {
        const { world } = await import('@minecraft/server');
        world.getAllPlayers.mockReturnValue([null]);
        expect(() => abilityRule.refreshOnlinePlayers()).not.toThrow();
    });

    it('should subscribe to events when onEnable is called', async () => {
        const { world } = await import('@minecraft/server');
        abilityRule.onEnable();
        expect(world.afterEvents.playerInventoryItemChange.subscribe).toHaveBeenCalled();
        expect(world.afterEvents.playerJoin.subscribe).toHaveBeenCalled();
        expect(world.beforeEvents.playerLeave.subscribe).toHaveBeenCalled();
    });

    it('should unsubscribe from events when onDisable is called', async () => {
        const { world } = await import('@minecraft/server');
        abilityRule.onDisable();
        expect(world.afterEvents.playerInventoryItemChange.unsubscribe).toHaveBeenCalled();
        expect(world.afterEvents.playerJoin.unsubscribe).toHaveBeenCalled();
        expect(world.beforeEvents.playerLeave.unsubscribe).toHaveBeenCalled();
    });

    it('should record the player join tick', () => {
        abilityRule.onPlayerJoin({ playerId: 'player1' });
        expect(abilityRule.playerJoinTick['player1']).toBe(0);
    });

    it('should disable the player on leave', () => {
        const player = { id: 'player1', onScreenDisplay: { setActionBar: vi.fn() } };
        abilityRule.enableForPlayer(player);
        abilityRule.onPlayerLeave({ player });
        expect(onPlayerDisableCallback).toHaveBeenCalledWith(player);
    });

    it('should return early from onPlayerLeave when player is null', () => {
        expect(() => abilityRule.onPlayerLeave({ player: null })).not.toThrow();
        expect(onPlayerDisableCallback).not.toHaveBeenCalled();
    });

    it('should use default no-op callbacks when onPlayerEnableCallback and onPlayerDisableCallback are not provided', () => {
        const ruleWithDefaults = new AbilityRule({ ...testRuleData, identifier: 'default_cb_rule' });
        const player = { id: 'p1', onScreenDisplay: { setActionBar: vi.fn() } };
        expect(() => ruleWithDefaults.enableForPlayer(player, { isSilent: false })).not.toThrow();
        expect(() => ruleWithDefaults.disableForPlayer(player, { isSilent: false })).not.toThrow();
    });
});
