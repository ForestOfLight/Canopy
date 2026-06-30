import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Rules } from '../../../../../../Canopy[BP]/scripts/lib/canopy/rules/Rules';
import { INFODISPLAY_RULE_IDENTIFIERS } from '../../../../../../Canopy[BP]/scripts/src/rules/infodisplay/infoDisplayIdentifiers';
import { InfoDisplay } from '../../../../../../Canopy[BP]/scripts/src/rules/infodisplay/InfoDisplay';

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

function createMockPlayer() {
    return {
        id: 'drift-test-player',
        getComponent: vi.fn(() => ({ push: vi.fn(), remove: vi.fn() })),
        getDynamicProperty: vi.fn(() => undefined),
        setDynamicProperty: vi.fn()
    };
}

describe('INFODISPLAY_RULE_IDENTIFIERS registry', () => {
    beforeEach(() => {
        Rules.clear();
        Rules.rulesToRegister = [];
    });

    it('contains no duplicate identifiers', () => {
        expect(new Set(INFODISPLAY_RULE_IDENTIFIERS).size).toBe(INFODISPLAY_RULE_IDENTIFIERS.length);
    });

    it('matches the InfoDisplay rules actually registered when an InfoDisplay is built', () => {
        new InfoDisplay(createMockPlayer());
        const registered = Rules.getByCategory('InfoDisplay').map(rule => rule.getID());

        // Both directions: every registered rule is in the list, and every list entry is registered.
        expect(new Set(registered)).toEqual(new Set(INFODISPLAY_RULE_IDENTIFIERS));
        expect(registered).toHaveLength(INFODISPLAY_RULE_IDENTIFIERS.length);
    });
});
