import { describe, it, expect, beforeEach, vi } from 'vitest';
import { worldDynamicPropertyStore } from '@forestoflight/minecraft-vitest-mocks';
import { simplayerActionInfo } from '../../../../../../Canopy[BP]/scripts/src/rules/simplayer/simplayerActionInfo';

describe('simplayerActionInfo', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        worldDynamicPropertyStore.set('simplayerActionInfo', void 0);
    });

    describe('getID', () => {
        it('returns the correct identifier', () => {
            expect(simplayerActionInfo.getID()).toBe('simplayerActionInfo');
        });
    });

    describe('getNativeValue', () => {
        it('returns true by default when no value is stored', () => {
            expect(simplayerActionInfo.getNativeValue()).toBe(true);
        });

        it('returns true when the rule is enabled', () => {
            worldDynamicPropertyStore.set('simplayerActionInfo', true);
            expect(simplayerActionInfo.getNativeValue()).toBe(true);
        });

        it('returns false when the rule is disabled', () => {
            worldDynamicPropertyStore.set('simplayerActionInfo', false);
            expect(simplayerActionInfo.getNativeValue()).toBe(false);
        });
    });
});
