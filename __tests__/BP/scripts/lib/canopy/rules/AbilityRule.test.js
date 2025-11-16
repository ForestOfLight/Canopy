import { describe, it, expect, vi, beforeEach } from "vitest";
import { AbilityRule } from "../../../../../../Canopy [BP]/scripts/lib/canopy/rules/AbilityRule";
import { Rules } from "../../../../../../Canopy [BP]/scripts/lib/canopy/rules/Rules";

vi.mock('@minecraft/server', () => ({
    world: { 
        beforeEvents: {
            chatSend: {
                subscribe: vi.fn()
            }
        },
        afterEvents: {
            worldLoad: {
                subscribe: vi.fn()
            },
            playerInventoryItemChange: {
                subscribe: vi.fn(),
                unsubscribe: vi.fn()
            }
        }
    },
    system: {
        afterEvents: {
            scriptEventReceive: {
                subscribe: vi.fn()
            }
        },
        runJob: vi.fn()
    }
}));

vi.mock("@minecraft/server-ui", () => ({
    ModalFormData: vi.fn()
}));

const onPlayerEnableCallback = vi.fn();
const onPlayerDisableCallback = vi.fn();

describe('AbilityRule', () => {
    let abilityRule;
    const testRuleData = {
        category: 'Rules',
        identifier: 'testRule',
    };

    beforeEach(() => {
        Rules.clear();
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
        const customArrowAbility = new AbilityRule(testRuleData, { slotNumber: 1, actionItem: 'minecraft:other_item'});
        expect(customArrowAbility.getActionItemId()).toBe('minecraft:other_item');
    });
});
