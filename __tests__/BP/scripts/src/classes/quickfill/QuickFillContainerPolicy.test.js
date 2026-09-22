import { Container, ItemStack } from "@minecraft/server";
import { QuickFillContainerPolicy } from "../../../../../../Canopy[BP]/scripts/src/classes/quickfill/QuickFillContainerPolicy";
import { describe, expect, test } from "vitest";

const makeBlock = typeId => ({ typeId });

describe('QuickFillContainerPolicy', () => {
    test('generic inventories are identified by slot count', () => {
        expect(QuickFillContainerPolicy.getShape(makeBlock('minecraft:chest'), new Container({ size: 27 }))).toBe('generic:27');
        expect(QuickFillContainerPolicy.getShape(makeBlock('minecraft:barrel'), new Container({ size: 27 }))).toBe('generic:27');
        expect(QuickFillContainerPolicy.getShape(makeBlock('minecraft:hopper'), new Container({ size: 5 }))).toBe('generic:5');
    });

    test('generic inventories are compatible across slot counts', () => {
        expect(QuickFillContainerPolicy.isCompatible('generic:5', 'generic:27')).toBe(true);
        expect(QuickFillContainerPolicy.isCompatible('generic:54', 'generic:5')).toBe(true);
    });
    test('furnace family uses separate semantic shapes', () => {
        const container = new Container({ size: 3 });

        expect(QuickFillContainerPolicy.getShape(makeBlock('minecraft:furnace'), container)).toBe('furnace:3');
        expect(QuickFillContainerPolicy.getShape(makeBlock('minecraft:lit_furnace'), container)).toBe('furnace:3');
        expect(QuickFillContainerPolicy.getShape(makeBlock('minecraft:smoker'), container)).toBe('smoker:3');
        expect(QuickFillContainerPolicy.getShape(makeBlock('minecraft:lit_smoker'), container)).toBe('smoker:3');
        expect(QuickFillContainerPolicy.getShape(makeBlock('minecraft:blast_furnace'), container)).toBe('blast_furnace:3');
        expect(QuickFillContainerPolicy.getShape(makeBlock('minecraft:lit_blast_furnace'), container)).toBe('blast_furnace:3');
    });

    test('specialized inventories remain distinct from generic inventories', () => {
        expect(QuickFillContainerPolicy.isCompatible('generic:5', 'brewing:5')).toBe(false);
        expect(QuickFillContainerPolicy.isCompatible('generic:3', 'furnace:3')).toBe(false);
        expect(QuickFillContainerPolicy.isCompatible('furnace:3', 'furnace:3')).toBe(true);
    });

    test('shulker boxes cannot be inserted into shulker boxes', () => {
        const block = makeBlock('minecraft:shulker_box');

        expect(QuickFillContainerPolicy.canInsertItem(block, new ItemStack('minecraft:red_shulker_box'), 0)).toBe(false);
        expect(QuickFillContainerPolicy.canInsertItem(block, new ItemStack('minecraft:stone'), 0)).toBe(true);
    });

    test('furnace output slot cannot be written or copied', () => {
        const block = makeBlock('minecraft:smoker');
        const item = new ItemStack('minecraft:stone');
        const container = new Container({ size: 3 });

        expect(QuickFillContainerPolicy.canInsertItem(block, item, 0)).toBe(true);
        expect(QuickFillContainerPolicy.canInsertItem(block, item, 1)).toBe(true);
        expect(QuickFillContainerPolicy.canInsertItem(block, item, 2)).toBe(false);
        expect(QuickFillContainerPolicy.getClipboardSlotCount(block, container)).toBe(2);
    });

    test.each([
        ['minecraft:furnace', true],
        ['minecraft:smoker', true],
        ['minecraft:blast_furnace', true],
        ['minecraft:brewing_stand', true],
        ['minecraft:chest', false]
    ])('%s clipboard-only = %s', (typeId, expected) => {
        expect(QuickFillContainerPolicy.isClipboardOnly(makeBlock(typeId))).toBe(expected);
    });
});
