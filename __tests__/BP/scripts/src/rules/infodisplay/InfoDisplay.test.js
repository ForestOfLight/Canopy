import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Rules } from '../../../../../../Canopy[BP]/scripts/lib/canopy/rules/Rules';
import { InfoDisplay } from '../../../../../../Canopy[BP]/scripts/src/rules/infodisplay/InfoDisplay';
import { InfoDisplayElement } from '../../../../../../Canopy[BP]/scripts/src/rules/infodisplay/InfoDisplayElement';

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
        id: 'info-display-test-player',
        getComponent: vi.fn(() => ({ push: vi.fn(), remove: vi.fn() })),
        getDynamicProperty: vi.fn(() => undefined),
        setDynamicProperty: vi.fn()
    };
}

describe('InfoDisplayElement.getRuleIdentifier enforcement', () => {
    it('throws when a subclass does not implement getRuleIdentifier', () => {
        class Unidentified extends InfoDisplayElement {}
        expect(() => Unidentified.getRuleIdentifier()).toThrow(/getRuleIdentifier/);
        expect(() => new Unidentified({ description: { text: '' } })).toThrow(/getRuleIdentifier/);
    });
});

describe('InfoDisplay.getRuleIdentifiers', () => {
    beforeEach(() => {
        Rules.clear();
        Rules.rulesToRegister = [];
    });

    it('returns the identifiers with no duplicates', () => {
        const identifiers = InfoDisplay.getRuleIdentifiers();
        expect(new Set(identifiers).size).toBe(identifiers.length);
    });

    it('matches the InfoDisplay rules actually registered when an InfoDisplay is built', () => {
        new InfoDisplay(createMockPlayer());
        const registered = Rules.getByCategory('InfoDisplay').map(rule => rule.getID());

        // Single source (InfoDisplay.elementSpecs) drives both, so these can never diverge.
        expect(new Set(registered)).toEqual(new Set(InfoDisplay.getRuleIdentifiers()));
        expect(registered).toHaveLength(InfoDisplay.getRuleIdentifiers().length);
    });
});

describe('InfoDisplay per-player element registration', () => {
    beforeEach(() => {
        Rules.clear();
        Rules.rulesToRegister = [];
    });

    it('registers every element against its own player', () => {
        const player = createMockPlayer();
        const infoDisplay = new InfoDisplay(player);

        for (const element of infoDisplay.elements)
            expect(element.rule.getPlayerElement(player.id)).toBe(element);
    });

    it('rebinds every element when the same player reconnects', () => {
        const firstSession = createMockPlayer();
        const firstDisplay = new InfoDisplay(firstSession);
        firstDisplay.destroy();

        const secondSession = createMockPlayer();
        const secondDisplay = new InfoDisplay(secondSession);

        for (const element of secondDisplay.elements)
            expect(element.rule.getPlayerElement(secondSession.id)).toBe(element);
        for (const element of firstDisplay.elements)
            expect(element.rule.getPlayerElement(firstSession.id)).not.toBe(element);
    });

    it('tears down every element without throwing, including rules that were never enabled', () => {
        const player = createMockPlayer();
        const infoDisplay = new InfoDisplay(player);

        expect(() => infoDisplay.destroy()).not.toThrow();
        for (const element of infoDisplay.elements)
            expect(element.rule.getPlayerElement(player.id)).toBeUndefined();
    });
});
