import { describe, it, expect, beforeEach, vi } from 'vitest';
import { system, world } from '@minecraft/server';
import { worldDynamicPropertyStore } from '@forestoflight/minecraft-vitest-mocks';

vi.mock('../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies', () => ({
    default: {
        create: vi.fn(),
        addNametagPrefix: vi.fn(),
        understudies: []
    }
}));

import Understudies from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies';
import { simplayerRejoining } from '../../../../../../Canopy[BP]/scripts/src/rules/simplayer/simplayerRejoining';

describe('simplayerRejoining', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        worldDynamicPropertyStore.set('simplayerRejoining', undefined);
        worldDynamicPropertyStore.set('simplayersToRejoin', undefined);
        Understudies.understudies = [];
    });

    describe('getID', () => {
        it('returns the correct identifier', () => {
            expect(simplayerRejoining.getID()).toBe('simplayerRejoining');
        });
    });

    describe('getNativeValue', () => {
        it('returns false by default', () => {
            expect(simplayerRejoining.getNativeValue()).toBe(false);
        });

        it('returns true when the rule is enabled', () => {
            worldDynamicPropertyStore.set('simplayerRejoining', true);
            expect(simplayerRejoining.getNativeValue()).toBe(true);
        });
    });

    describe('subscribeToEvent', () => {
        it('subscribes to the shutdown event', () => {
            simplayerRejoining.subscribeToEvent();
            expect(system.beforeEvents.shutdown.subscribe).toHaveBeenCalledWith(simplayerRejoining.onShutdownBound);
        });
    });

    describe('unsubscribeFromEvent', () => {
        it('unsubscribes from the shutdown event', () => {
            simplayerRejoining.unsubscribeFromEvent();
            expect(system.beforeEvents.shutdown.unsubscribe).toHaveBeenCalledWith(simplayerRejoining.onShutdownBound);
        });
    });

    describe('onShutdown', () => {
        it('saves the names of online simplayers when the rule is enabled', () => {
            worldDynamicPropertyStore.set('simplayerRejoining', true);
            Understudies.understudies = [{ name: 'Alice' }, { name: 'Bob' }];
            simplayerRejoining.onShutdown();
            expect(world.setDynamicProperty).toHaveBeenCalledWith('simplayersToRejoin', JSON.stringify(['Alice', 'Bob']));
        });

        it('saves an empty array when no simplayers are online', () => {
            worldDynamicPropertyStore.set('simplayerRejoining', true);
            Understudies.understudies = [];
            simplayerRejoining.onShutdown();
            expect(world.setDynamicProperty).toHaveBeenCalledWith('simplayersToRejoin', JSON.stringify([]));
        });

        it('saves an empty array when the rule is disabled', () => {
            worldDynamicPropertyStore.set('simplayerRejoining', false);
            Understudies.understudies = [{ name: 'Alice' }];
            simplayerRejoining.onShutdown();
            expect(world.setDynamicProperty).toHaveBeenCalledWith('simplayersToRejoin', JSON.stringify([]));
        });
    });

    describe('onStartup', () => {
        it('does nothing when the rule is disabled', () => {
            worldDynamicPropertyStore.set('simplayerRejoining', false);
            simplayerRejoining.onStartup();
            expect(Understudies.create).not.toHaveBeenCalled();
        });

        it('does nothing when no player list is stored', () => {
            worldDynamicPropertyStore.set('simplayerRejoining', true);
            simplayerRejoining.onStartup();
            expect(Understudies.create).not.toHaveBeenCalled();
        });

        it('does nothing when stored player list is invalid JSON', () => {
            worldDynamicPropertyStore.set('simplayerRejoining', true);
            worldDynamicPropertyStore.set('simplayersToRejoin', 'not valid json');
            const warnSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            simplayerRejoining.onStartup();
            expect(Understudies.create).not.toHaveBeenCalled();
            warnSpy.mockRestore();
        });

        it('creates and rejoins simplayers listed in the stored data', () => {
            worldDynamicPropertyStore.set('simplayerRejoining', true);
            worldDynamicPropertyStore.set('simplayersToRejoin', JSON.stringify(['Alice', 'Bob']));
            const mockPlayer = { rejoin: vi.fn() };
            vi.mocked(Understudies.create).mockReturnValue(mockPlayer);
            simplayerRejoining.onStartup();
            expect(Understudies.create).toHaveBeenCalledWith('Alice');
            expect(Understudies.create).toHaveBeenCalledWith('Bob');
            expect(mockPlayer.rejoin).toHaveBeenCalledTimes(2);
        });

        it('logs an error and continues when a player fails to rejoin', () => {
            worldDynamicPropertyStore.set('simplayerRejoining', true);
            worldDynamicPropertyStore.set('simplayersToRejoin', JSON.stringify(['Alice', 'Bob']));
            const alicePlayer = { rejoin: vi.fn(() => { throw new Error('rejoin failed'); }) };
            const bobPlayer = { rejoin: vi.fn() };
            vi.mocked(Understudies.create)
                .mockReturnValueOnce(alicePlayer)
                .mockReturnValueOnce(bobPlayer);
            const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            simplayerRejoining.onStartup();
            expect(bobPlayer.rejoin).toHaveBeenCalled();
            errorSpy.mockRestore();
        });
    });
});
