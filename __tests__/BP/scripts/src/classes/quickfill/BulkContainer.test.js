import { describe, expect, test } from "vitest";
import { BulkContainer } from "../../../../../../Canopy[BP]/scripts/src/classes/quickfill/BulkContainer";

describe('BulkContainer', () => {
    test('defaults to a double chest of full stacks of stone', () => {
        const container = new BulkContainer();

        expect(container.size).toBe(54);
        expect(container.getItemTypeId()).toBe('minecraft:stone');
        for (let i = 0; i < container.size; i++) {
            expect(container.getItem(i).typeId).toBe('minecraft:stone');
            expect(container.getItem(i).amount).toBe(64);
        }
    });

    test('fills every slot with the requested item type and size', () => {
        const container = new BulkContainer('minecraft:dirt', 5);

        expect(container.size).toBe(5);
        expect(container.getItemTypeId()).toBe('minecraft:dirt');
        expect(Array.from({ length: 5 }, (_, i) => container.getItem(i).typeId)).toEqual(Array(5).fill('minecraft:dirt'));
    });

    test('has no item beyond its size', () => {
        expect(new BulkContainer('minecraft:dirt', 3).getItem(3)).toBeUndefined();
    });

    test('gives each slot its own item stack', () => {
        const container = new BulkContainer('minecraft:dirt', 2);

        container.getItem(0).amount = 1;

        expect(container.getItem(1).amount).toBe(64);
    });
});
