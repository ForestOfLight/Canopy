import { describe, it, expect, beforeEach, vi } from 'vitest';
import { worldDynamicPropertyStore } from '@forestoflight/minecraft-vitest-mocks';
import { simplayerSaving } from '../../../../../../Canopy[BP]/scripts/src/rules/simplayer/simplayerSaving';

describe('simplayerSaving', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        worldDynamicPropertyStore.set('simplayerSaving', void 0);
    });

    describe('getID', () => {
        it('returns the correct identifier', () => {
            expect(simplayerSaving.getID()).toBe('simplayerSaving');
        });
    });

    describe('getNativeValue', () => {
        it('returns true by default when no value is stored', () => {
            expect(simplayerSaving.getNativeValue()).toBe(true);
        });

        it('returns true when the rule is enabled', () => {
            worldDynamicPropertyStore.set('simplayerSaving', true);
            expect(simplayerSaving.getNativeValue()).toBe(true);
        });

        it('returns false when the rule is explicitly disabled', () => {
            worldDynamicPropertyStore.set('simplayerSaving', false);
            expect(simplayerSaving.getNativeValue()).toBe(false);
        });
    });
});
