import { Container, EntityComponentTypes, ItemStack } from "@minecraft/server";
import { QuickFillClipboard } from "../../../../../../Canopy[BP]/scripts/src/classes/quickfill/QuickFillClipboard";
import { describe, expect, test } from "vitest";

const makeBlock = (typeId = 'minecraft:chest') => ({ typeId });

const makeEntity = (container, strength = 2) => ({
    typeId: 'minecraft:llama',
    getComponent(component) {
        if (component === EntityComponentTypes.Inventory)
            return { container, containerType: 'horse', additionalSlotsPerStrength: 3 };
        if (component === EntityComponentTypes.Strength)
            return { value: strength };
    },
    hasComponent: component => component === EntityComponentTypes.IsChested
});

describe('QuickFillClipboard', () => {
    test('copy creates a literal clipboard with the source inventory shape', () => {
        const stone = new ItemStack('minecraft:stone', 17);
        const dirt = new ItemStack('minecraft:dirt');
        const container = new Container({ size: 5, items: { 1: stone, 4: dirt } });
        const clipboard = QuickFillClipboard.copy(makeBlock('minecraft:hopper'), container);

        expect(clipboard.shape).toBe('generic:5');
        expect(clipboard.slots).toHaveLength(5);

        expect(clipboard.slots[0]).toBeUndefined();
        expect(clipboard.slots[1]).not.toBe(stone);
        expect(clipboard.slots[1].amount).toBe(17);
        expect(clipboard.slots[4].typeId).toBe('minecraft:dirt');
    });

    test('literal clipboard is compatible with equivalent inventory shapes', () => {
        const clipboard = QuickFillClipboard.copy(makeBlock(), new Container({ size: 27 }));

        expect(clipboard.isCompatibleWith(makeBlock('minecraft:barrel'), new Container({ size: 27 }))).toBe(true);
        expect(clipboard.isCompatibleWith(makeBlock('minecraft:shulker_box'), new Container({ size: 27 }))).toBe(true);
    });

    test('literal clipboard rejects a different inventory shape', () => {
        const clipboard = QuickFillClipboard.copy(makeBlock('minecraft:hopper'), new Container({ size: 5 }));

        expect(clipboard.isCompatibleWith(makeBlock('minecraft:brewing_stand'), new Container({ size: 5 }))).toBe(false);
    });

    test('clipboard clone does not share item references', () => {
        const clipboard = new QuickFillClipboard({ shape: 'generic:5', slots: [new ItemStack('minecraft:stone', 17)] });
        const copy = clipboard.clone();

        expect(copy).not.toBe(clipboard);
        expect(copy.slots).not.toBe(clipboard.slots);
        expect(copy.slots[0]).not.toBe(clipboard.slots[0]);
        expect(copy.slots[0].amount).toBe(17);
    });

    test('entity copy stores only cargo as logical clipboard slots', () => {
        const container = new Container({ size: 16, items: {
            0: new ItemStack('minecraft:red_carpet'),
            1: new ItemStack('minecraft:stone', 5),
            6: new ItemStack('minecraft:dirt', 3),
            7: new ItemStack('minecraft:diamond', 2)
        }});
        const clipboard = QuickFillClipboard.copy(makeEntity(container), container);

        expect(clipboard.slots).toHaveLength(6);
        expect(clipboard.slots[0].typeId).toBe('minecraft:stone');
        expect(clipboard.slots[0].amount).toBe(5);
        expect(clipboard.slots[5].typeId).toBe('minecraft:dirt');
        expect(clipboard.slots.some(item => item?.typeId === 'minecraft:red_carpet')).toBe(false);
        expect(clipboard.slots.some(item => item?.typeId === 'minecraft:diamond')).toBe(false);
    });
});
