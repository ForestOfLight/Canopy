import { QuickFillContainerPolicy } from "../../../../../Canopy[BP]/scripts/src/classes/QuickFillContainerPolicy";
import { describe, expect, test } from "vitest";

describe('QuickFillContainerPolicy', () => {
    function makeBlock(typeId) {
        return { typeId };
    }

    function makeContainer(size) {
        return { size };
    }

    test('generic inventories are identified by slot count', () => {
        expect(
            QuickFillContainerPolicy.getShape(
                makeBlock('minecraft:chest'),
                makeContainer(27)
            )
        ).toBe('generic:27');

        expect(
            QuickFillContainerPolicy.getShape(
                makeBlock('minecraft:barrel'),
                makeContainer(27)
            )
        ).toBe('generic:27');

        expect(
            QuickFillContainerPolicy.getShape(
                makeBlock('minecraft:hopper'),
                makeContainer(5)
            )
        ).toBe('generic:5');
    });

    test('same-count specialized inventories keep distinct semantics', () => {
        expect(
            QuickFillContainerPolicy.getShape(
                makeBlock('minecraft:hopper'),
                makeContainer(5)
            )
        ).toBe('generic:5');

        expect(
            QuickFillContainerPolicy.getShape(
                makeBlock('minecraft:brewing_stand'),
                makeContainer(5)
            )
        ).toBe('brewing:5');

        expect(
            QuickFillContainerPolicy.getShape(
                makeBlock('minecraft:dropper'),
                makeContainer(9)
            )
        ).toBe('generic:9');

        expect(
            QuickFillContainerPolicy.getShape(
                makeBlock('minecraft:crafter'),
                makeContainer(9)
            )
        ).toBe('crafter:9');
    });

    test('equivalent furnace states share their semantic shape', () => {
        expect(
            QuickFillContainerPolicy.getShape(
                makeBlock('minecraft:furnace'),
                makeContainer(3)
            )
        ).toBe('furnace:3');

        expect(
            QuickFillContainerPolicy.getShape(
                makeBlock('minecraft:lit_furnace'),
                makeContainer(3)
            )
        ).toBe('furnace:3');
    });

    test('generic containers with the same count are compatible', () => {
        expect(
            QuickFillContainerPolicy.isCompatible(
                'generic:27',
                'generic:27'
            )
        ).toBe(true);

        expect(
            QuickFillContainerPolicy.isCompatible(
                'generic:9',
                'generic:9'
            )
        ).toBe(true);
    });

    test('same-count containers with different semantics are incompatible', () => {
        expect(
            QuickFillContainerPolicy.isCompatible(
                'generic:5',
                'brewing:5'
            )
        ).toBe(false);

        expect(
            QuickFillContainerPolicy.isCompatible(
                'generic:9',
                'crafter:9'
            )
        ).toBe(false);

        expect(
            QuickFillContainerPolicy.isCompatible(
                'generic:3',
                'furnace:3'
            )
        ).toBe(false);
    });

    test('adaptive clipboard shape is compatible with any inventory shape', () => {
        expect(
            QuickFillContainerPolicy.isCompatible(
                QuickFillContainerPolicy.AdaptiveShape,
                'generic:27'
            )
        ).toBe(true);

        expect(
            QuickFillContainerPolicy.isCompatible(
                QuickFillContainerPolicy.AdaptiveShape,
                'brewing:5'
            )
        ).toBe(true);
    });
});