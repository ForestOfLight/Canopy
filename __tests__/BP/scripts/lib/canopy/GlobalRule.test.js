import { describe, it, expect, vi, beforeEach } from "vitest";
import { GlobalRule } from "../../../../../Canopy [BP]/scripts/lib/canopy/rules/GlobalRule";
import { Rules } from "../../../../../Canopy [BP]/scripts/lib/canopy/rules/Rules";

vi.mock('@minecraft/server', () => ({
    world: { 
        beforeEvents: {
            chatSend: {
                subscribe: vi.fn()
            }
        },
        afterEvents: {
            worldLoad: {
                subscribe: (callback) => {
                    callback();
                }
            }
        },
        getDynamicProperty: vi.fn()
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