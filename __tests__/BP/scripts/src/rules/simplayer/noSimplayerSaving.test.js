import { describe, it, expect, beforeEach, vi } from 'vitest';
import { worldDynamicPropertyStore } from '@forestoflight/minecraft-vitest-mocks';
import { noSimplayerSaving } from '../../../../../../Canopy[BP]/scripts/src/rules/simplayer/noSimplayerSaving';

describe('noSimplayerSaving', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        worldDynamicPropertyStore.set('noSimplayerSaving', undefined);
    });

    describe('getID', () => {
        it('returns the correct identifier', () => {
            expect(noSimplayerSaving.getID()).toBe('noSimplayerSaving');
        });
    });

    describe('getNativeValue', () => {
        it('returns false by default when no value is stored', () => {
            expect(noSimplayerSaving.getNativeValue()).toBe(false);
        });

        it('returns true when the rule is enabled', () => {
            worldDynamicPropertyStore.set('noSimplayerSaving', true);
            expect(noSimplayerSaving.getNativeValue()).toBe(true);
        });

        it('returns false when the rule is explicitly disabled', () => {
            worldDynamicPropertyStore.set('noSimplayerSaving', false);
            expect(noSimplayerSaving.getNativeValue()).toBe(false);
        });
    });
});
