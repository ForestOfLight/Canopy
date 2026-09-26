import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Rules } from '../../../../../../Canopy[BP]/scripts/lib/canopy/rules/Rules';
import { InfoDisplay } from '../../../../../../Canopy[BP]/scripts/src/rules/infodisplay/InfoDisplay';
import { InfoDisplayElement } from '../../../../../../Canopy[BP]/scripts/src/rules/infodisplay/InfoDisplayElement';
import { QuickFillClipboardStore } from '../../../../../../Canopy[BP]/scripts/src/classes/quickfill/QuickFillClipboardStore';
import { quickFillContainer } from '../../../../../../Canopy[BP]/scripts/src/rules/quickFillContainer';

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
        onScreenDisplay: {
            setTitle: vi.fn(),
            updateSubtitle: vi.fn()
        },
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

describe('InfoDisplay', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        Rules.clear();
        Rules.rulesToRegister = [];
    });

    it('returns the identifiers with no duplicates', () => {
        const identifiers = InfoDisplay.getRuleIdentifiers();
        expect(new Set(identifiers).size).toBe(identifiers.length);
        expect(identifiers).toEqual(expect.arrayContaining(['quickFillStatus', 'clipboardStatus']));
    });

    it('matches the InfoDisplay rules actually registered when an InfoDisplay is built', () => {
        new InfoDisplay(createMockPlayer());
        const registered = Rules.getByCategory('InfoDisplay').map(rule => rule.getID());

        expect(new Set(registered)).toEqual(new Set(InfoDisplay.getRuleIdentifiers()));
        expect(registered).toHaveLength(InfoDisplay.getRuleIdentifiers().length);
    });

    it.each([
        [false, false, ''],
        [true, false, 'Quick Fill: \u00A7aActive\u00A7r'],
        [false, true, 'Clipboard: \u00A7aActive\u00A7r'],
        [true, true, 'Quick Fill: \u00A7aActive\u00A7r\nClipboard: \u00A7aActive\u00A7r']
    ])('formats Quick Fill %s and clipboard %s status', (quickFillActive, clipboardActive, expected) => {
        const player = createMockPlayer();
        vi.spyOn(quickFillContainer, 'isEnabledForPlayer').mockReturnValue(quickFillActive);
        vi.spyOn(QuickFillClipboardStore, 'has').mockReturnValue(clipboardActive);

        const infoDisplay = new InfoDisplay(player);

        expect(infoDisplay.getStatusMessage()).toBe(expected);
    });

    it.each([
        ['quickFillStatus', 'Clipboard: \u00A7aActive\u00A7r'],
        ['clipboardStatus', 'Quick Fill: \u00A7aActive\u00A7r']
    ])('respects disabled %s independently', (disabledRule, expected) => {
        const player = createMockPlayer();
        player.getDynamicProperty.mockImplementation(identifier => identifier === disabledRule ? false : undefined);
        vi.spyOn(quickFillContainer, 'isEnabledForPlayer').mockReturnValue(true);
        vi.spyOn(QuickFillClipboardStore, 'has').mockReturnValue(true);

        const infoDisplay = new InfoDisplay(player);

        expect(infoDisplay.getStatusMessage()).toBe(expected);
    });

    it('initializes the status subtitle and refreshes it with updateSubtitle', () => {
        const player = createMockPlayer();
        vi.spyOn(quickFillContainer, 'isEnabledForPlayer').mockReturnValue(true);
        vi.spyOn(QuickFillClipboardStore, 'has').mockReturnValue(false);

        const infoDisplay = new InfoDisplay(player);
        infoDisplay.clearedPreviousMessage = true;

        infoDisplay.sendInfoMessage();

        expect(player.onScreenDisplay.setTitle).toHaveBeenCalledWith('', {
            subtitle: 'Quick Fill: \u00A7aActive\u00A7r',
            fadeInDuration: 0,
            stayDuration: 2,
            fadeOutDuration: 0
        });
        expect(player.onScreenDisplay.updateSubtitle).not.toHaveBeenCalled();

        infoDisplay.infoMessage = { rawtext: [] };
        player.onScreenDisplay.setTitle.mockClear();

        infoDisplay.sendInfoMessage();

        expect(player.onScreenDisplay.setTitle).not.toHaveBeenCalled();
        expect(player.onScreenDisplay.updateSubtitle).toHaveBeenCalledWith('Quick Fill: \u00A7aActive\u00A7r');
    });

    it('clears the status subtitle when the last active status turns off', () => {
        const player = createMockPlayer();
        vi.spyOn(quickFillContainer, 'isEnabledForPlayer').mockReturnValue(false);
        vi.spyOn(QuickFillClipboardStore, 'has').mockReturnValue(false);

        const infoDisplay = new InfoDisplay(player);
        infoDisplay.clearedPreviousMessage = true;
        infoDisplay.lastStatusMessage = 'Quick Fill: \u00A7aActive\u00A7r';

        infoDisplay.sendInfoMessage();

        expect(player.onScreenDisplay.setTitle).not.toHaveBeenCalled();
        expect(player.onScreenDisplay.updateSubtitle).toHaveBeenCalledWith('');
        expect(infoDisplay.lastStatusMessage).toBe('');
    });
});
