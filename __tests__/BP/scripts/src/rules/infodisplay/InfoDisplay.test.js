import { describe, it, expect, vi, beforeEach } from 'vitest';
import { system } from '@minecraft/server';
import { Rules } from '../../../../../../Canopy[BP]/scripts/lib/canopy/rules/Rules';
import { InfoDisplay } from '../../../../../../Canopy[BP]/scripts/src/rules/infodisplay/InfoDisplay';
import { InfoDisplayElement } from '../../../../../../Canopy[BP]/scripts/src/rules/infodisplay/InfoDisplayElement';

const { playerLeaveHandlers } = vi.hoisted(() => ({ playerLeaveHandlers: [] }));

vi.mock('@minecraft/server', async (importOriginal) => {
    const original = await importOriginal();
    return {
        ...original,
        world: {
            ...original.world,
            afterEvents: {
                ...original.world.afterEvents,
                worldLoad: { subscribe: (callback) => callback() }
            },
            beforeEvents: {
                ...original.world.beforeEvents,
                playerLeave: { subscribe: (callback) => playerLeaveHandlers.push(callback) }
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

describe('InfoDisplay.scheduleTeardown', () => {
    let deferred;

    beforeEach(() => {
        Rules.clear();
        Rules.rulesToRegister = [];
        InfoDisplay.playerToInfoDisplayMap = {};
        deferred = [];
        system.run.mockImplementation((callback) => deferred.push(callback));
    });

    function runDeferred() {
        const pending = deferred;
        deferred = [];
        for (const callback of pending)
            callback();
    }

    it('does not tear down inline, since before-events run in restricted-execution mode', () => {
        const player = createMockPlayer();
        const infoDisplay = new InfoDisplay(player);

        InfoDisplay.scheduleTeardown(player.id);

        expect(InfoDisplay.playerToInfoDisplayMap[player.id]).toBe(infoDisplay);
        expect(deferred).toHaveLength(1);
    });

    it('removes the InfoDisplay and unregisters its elements once the deferred run fires', () => {
        const player = createMockPlayer();
        const infoDisplay = new InfoDisplay(player);

        InfoDisplay.scheduleTeardown(player.id);
        runDeferred();

        expect(InfoDisplay.playerToInfoDisplayMap[player.id]).toBeUndefined();
        for (const element of infoDisplay.elements)
            expect(element.rule.getPlayerElement(player.id)).toBeUndefined();
    });

    it('lets the tick loop build a fresh InfoDisplay after a leave', () => {
        const firstSession = createMockPlayer();
        new InfoDisplay(firstSession);

        InfoDisplay.scheduleTeardown(firstSession.id);
        runDeferred();

        const secondSession = createMockPlayer();
        const rebuilt = InfoDisplay.playerToInfoDisplayMap[secondSession.id] || new InfoDisplay(secondSession);

        expect(rebuilt.player).toBe(secondSession);
        for (const element of rebuilt.elements)
            expect(element.rule.getPlayerElement(secondSession.id)).toBe(element);
    });

    it('leaves a rejoining player\'s new InfoDisplay intact when the old teardown fires late', () => {
        const firstSession = createMockPlayer();
        new InfoDisplay(firstSession);
        InfoDisplay.scheduleTeardown(firstSession.id);

        const secondSession = createMockPlayer();
        const rejoined = new InfoDisplay(secondSession);
        runDeferred();

        expect(InfoDisplay.playerToInfoDisplayMap[secondSession.id]).toBe(rejoined);
        for (const element of rejoined.elements)
            expect(element.rule.getPlayerElement(secondSession.id)).toBe(element);
    });

    it('does nothing when the player has no InfoDisplay', () => {
        expect(() => InfoDisplay.scheduleTeardown('never-joined')).not.toThrow();
        expect(deferred).toHaveLength(0);
    });

    it('is wired to the player-leave before-event, which carries the leaving Player', () => {
        expect(playerLeaveHandlers).toHaveLength(1);
        const player = createMockPlayer();
        new InfoDisplay(player);

        playerLeaveHandlers[0]({ player });
        runDeferred();

        expect(InfoDisplay.playerToInfoDisplayMap[player.id]).toBeUndefined();
    });

    it('survives a leave event with no player', () => {
        expect(() => playerLeaveHandlers[0]({ player: undefined })).not.toThrow();
        expect(deferred).toHaveLength(0);
    });
});
