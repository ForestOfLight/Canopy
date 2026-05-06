import { describe, it, expect, vi, beforeEach } from "vitest";
import { GlobalRule } from "../../../../../../Canopy[BP]/scripts/lib/canopy/rules/GlobalRule";
import { Rules } from "../../../../../../Canopy[BP]/scripts/lib/canopy/rules/Rules";

vi.mock('@minecraft/server', async (importOriginal) => {
    const original = await importOriginal();
    return {
        ...original,
        world: {
            ...original.world,
            afterEvents: {
                ...original.world.afterEvents,
                worldLoad: { subscribe: (callback) => callback() }
            }
        }
    };
});

describe('GlobalRule', () => {
    beforeEach(() => {
        Rules.clear();
    });

    it('should have a method to morph rules into the global defaults', () => {
        const newOptions = GlobalRule.morphOptions({
            identifier: 'testRule'
        });
        expect(newOptions.category).toBe('Rules');
        expect(newOptions.description).toEqual({ translate: `rules.${newOptions.identifier}`})
    });
});