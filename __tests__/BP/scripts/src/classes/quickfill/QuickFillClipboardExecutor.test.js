import { Container, ItemStack } from "@minecraft/server";
import { QuickFillClipboard } from "../../../../../../Canopy[BP]/scripts/src/classes/quickfill/QuickFillClipboard";
import { QuickFillClipboardExecutor } from "../../../../../../Canopy[BP]/scripts/src/classes/quickfill/QuickFillClipboardExecutor";
import { describe, expect, test } from "vitest";

const makeBlock = (typeId = 'minecraft:hopper') => ({ typeId });
const makeClipboard = (block, container) => QuickFillClipboard.copy(block, container);

describe('QuickFillClipboardExecutor', () => {
    test('creative paste reproduces literal slot amounts', () => {
        const source = new Container({ size: 5, items: {
            1: new ItemStack('minecraft:stone', 17),
            2: new ItemStack('minecraft:stone'),
            3: new ItemStack('minecraft:stone'),
            4: new ItemStack('minecraft:stone')
        }});
        const target = new Container({ size: 5 });
        const result = QuickFillClipboardExecutor.applyCreative(makeBlock(), target, makeClipboard(makeBlock(), source));

        expect(result.changedSlots).toBe(4);
        expect(target.getItem(0)).toBeUndefined();
        expect(target.getItem(1).amount).toBe(17);
        expect(target.getItem(2).amount).toBe(1);
        expect(target.getItem(3).amount).toBe(1);
        expect(target.getItem(4).amount).toBe(1);
    });

    test('creative paste does not overwrite a different item', () => {
        const source = new Container({ size: 5, items: { 1: new ItemStack('minecraft:stone', 17) } });
        const dirt = new ItemStack('minecraft:dirt', 32);
        const target = new Container({ size: 5, items: { 1: dirt } });

        QuickFillClipboardExecutor.applyCreative(makeBlock(), target, makeClipboard(makeBlock(), source));
        expect(target.getItem(1)).toBe(dirt);
    });

    test('creative paste tops up matching slots to clipboard amount', () => {
        const source = new Container({ size: 5, items: { 1: new ItemStack('minecraft:stone', 17) } });
        const target = new Container({ size: 5, items: { 1: new ItemStack('minecraft:stone', 5) } });

        QuickFillClipboardExecutor.applyCreative(makeBlock(), target, makeClipboard(makeBlock(), source));
        expect(target.getItem(1).amount).toBe(17);
    });

    test('creative paste skips nested shulker boxes without blocking other slots', () => {
        const sourceBlock = makeBlock('minecraft:chest');
        const targetBlock = makeBlock('minecraft:shulker_box');
        const source = new Container({ size: 27, items: {
            0: new ItemStack('minecraft:red_shulker_box'),
            1: new ItemStack('minecraft:stone', 8)
        }});
        const target = new Container({ size: 27 });
        const result = QuickFillClipboardExecutor.applyCreative(targetBlock, target, makeClipboard(sourceBlock, source));

        expect(result.changedSlots).toBe(1);
        expect(target.getItem(0)).toBeUndefined();
        expect(target.getItem(1).amount).toBe(8);
    });

    test('furnace family paste is slot-for-slot and excludes output', () => {
        const block = makeBlock('minecraft:smoker');
        const source = new Container({ size: 3, items: {
            0: new ItemStack('minecraft:beef', 4),
            1: new ItemStack('minecraft:coal', 2),
            2: new ItemStack('minecraft:cooked_beef', 3)
        }});
        const target = new Container({ size: 3 });
        const result = QuickFillClipboardExecutor.applyCreative(block, target, makeClipboard(block, source));

        expect(result.changedSlots).toBe(2);
        expect(target.getItem(0).amount).toBe(4);
        expect(target.getItem(1).amount).toBe(2);
        expect(target.getItem(2)).toBeUndefined();
    });

    test('furnace family clipboard shapes are incompatible with one another', () => {
        const sourceBlock = makeBlock('minecraft:smoker');
        const targetBlock = makeBlock('minecraft:blast_furnace');
        const source = new Container({ size: 3, items: { 0: new ItemStack('minecraft:beef', 4) } });
        const result = QuickFillClipboardExecutor.applyCreative(targetBlock, new Container({ size: 3 }), makeClipboard(sourceBlock, source));

        expect(result.incompatible).toBe(true);
    });

    test('brewing stand paste is slot-for-slot', () => {
        const block = makeBlock('minecraft:brewing_stand');
        const source = new Container({ size: 5, items: {
            0: new ItemStack('minecraft:potion'),
            1: new ItemStack('minecraft:potion'),
            2: new ItemStack('minecraft:potion'),
            3: new ItemStack('minecraft:nether_wart'),
            4: new ItemStack('minecraft:blaze_powder')
        }});
        const target = new Container({ size: 5 });
        const result = QuickFillClipboardExecutor.applyCreative(block, target, makeClipboard(block, source));

        expect(result.changedSlots).toBe(5);
        expect(target.getItem(0).typeId).toBe('minecraft:potion');
        expect(target.getItem(1).typeId).toBe('minecraft:potion');
        expect(target.getItem(2).typeId).toBe('minecraft:potion');
        expect(target.getItem(3).typeId).toBe('minecraft:nether_wart');
        expect(target.getItem(4).typeId).toBe('minecraft:blaze_powder');
    });

    test('survival paste consumes only required resources', () => {
        const block = makeBlock();
        const source = new Container({ size: 5, items: { 1: new ItemStack('minecraft:stone', 17) } });
        const target = new Container({ size: 5, items: { 1: new ItemStack('minecraft:stone', 5) } });
        const player = new Container({ size: 9, items: { 0: new ItemStack('minecraft:stone', 12) } });
        const result = QuickFillClipboardExecutor.applySurvival(player, block, target, makeClipboard(block, source));

        expect(result.changedSlots).toBe(1);
        expect(target.getItem(1).amount).toBe(17);
        expect(player.getItem(0)).toBeUndefined();
    });

    test('survival paste makes no changes when resources are insufficient', () => {
        const block = makeBlock();
        const source = new Container({ size: 5, items: { 1: new ItemStack('minecraft:stone', 20) } });
        const target = new Container({ size: 5 });
        const player = new Container({ size: 9, items: { 0: new ItemStack('minecraft:stone', 19) } });
        const result = QuickFillClipboardExecutor.applySurvival(player, block, target, makeClipboard(block, source));

        expect(result.insufficient).toBe(true);
        expect(player.getItem(0).amount).toBe(19);
        expect(target.getItem(1)).toBeUndefined();
    });

    test('survival paste ignores prohibited shulker slots when checking resources', () => {
        const sourceBlock = makeBlock('minecraft:chest');
        const targetBlock = makeBlock('minecraft:shulker_box');
        const source = new Container({ size: 27, items: {
            0: new ItemStack('minecraft:red_shulker_box'),
            1: new ItemStack('minecraft:stone', 4)
        }});
        const target = new Container({ size: 27 });
        const player = new Container({ size: 9, items: { 0: new ItemStack('minecraft:stone', 4) } });
        const result = QuickFillClipboardExecutor.applySurvival(player, targetBlock, target, makeClipboard(sourceBlock, source));

        expect(result.changedSlots).toBe(1);
        expect(result.insufficient).toBeUndefined();
        expect(target.getItem(0)).toBeUndefined();
        expect(target.getItem(1).amount).toBe(4);
    });

    test('remove never touches furnace output', () => {
        const block = makeBlock('minecraft:furnace');
        const source = new Container({ size: 3, items: {
            0: new ItemStack('minecraft:coal', 2),
            2: new ItemStack('minecraft:iron_ingot', 3)
        }});
        const target = new Container({ size: 3, items: {
            0: new ItemStack('minecraft:coal', 5),
            2: new ItemStack('minecraft:iron_ingot', 8)
        }});
        const player = new Container({ size: 9 });
        const result = QuickFillClipboardExecutor.remove(player, block, target, makeClipboard(block, source));

        expect(result.changedSlots).toBe(1);
        expect(target.getItem(0).amount).toBe(3);
        expect(target.getItem(2).amount).toBe(8);
        expect(player.getItem(0).typeId).toBe('minecraft:coal');
        expect(player.getItem(0).amount).toBe(2);
    });

    test('same-size incompatible semantic shapes are rejected', () => {
        const block = makeBlock('minecraft:hopper');
        const clipboard = makeClipboard(block, new Container({ size: 5, items: { 1: new ItemStack('minecraft:stone') } }));
        const result = QuickFillClipboardExecutor.applyCreative(makeBlock('minecraft:brewing_stand'), new Container({ size: 5 }), clipboard);

        expect(result.incompatible).toBe(true);
    });
});
