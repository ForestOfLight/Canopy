import { GlobalRule } from "../../../../../Canopy [BP]/scripts/lib/canopy/GlobalRule";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Rules } from "../../../../../Canopy [BP]/scripts/lib/canopy/Rules";

vi.mock('@minecraft/server', () => ({
    world: { 
        beforeEvents: {
            chatSend: {
                subscribe: vi.fn()
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

    it('should create a new rule in the Rules category', () => {
        const testRule = new GlobalRule({
            identifier: 'testRule',
            description: { text: 'Test Description' }
        });
        expect(Rules.get(testRule.getID())).toBeDefined();
    });

    it('should autofill the category with the global rules magic string', () => {
        const testRule = new GlobalRule({
            identifier: 'testRule',
            description: { text: 'Test Description' }
        });
        expect(testRule.getCategory()).toBe('Rules');
    });

    it('should autofill the description if it is missing', () => {
        const testRule = new GlobalRule({
            identifier: 'testRule'
        });
        expect(testRule.getDescription()).toEqual({ translate: `rules.${testRule.getID()}`})
    })
});