import { vi, describe, it, expect, beforeEach } from 'vitest';
import { system, world } from '@minecraft/server';
import { RepeatableAction, REPEATABLE_ACTIONS } from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/RepeatableAction';
import Understudy from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudy';
import { UnknownRepeatingActionError } from '../../../../../../Canopy[BP]/scripts/src/classes/errors/UnknownRepeatingActionError';
import { UnderstudyNotConnectedError } from '../../../../../../Canopy[BP]/scripts/src/classes/errors/UnderstudyNotConnectedError';

vi.mock('../../../../../../Canopy[BP]/scripts/src/rules/simplayer/noSimplayerSaving', () => ({
    noSimplayerSaving: { getNativeValue: vi.fn(() => false), getID: vi.fn(() => 'noSimplayerSaving') }
}));
vi.mock('../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies', () => ({
    default: { onConnect: vi.fn() }
}));

describe('RepeatableAction', () => {
    let understudy;

    beforeEach(() => {
        vi.clearAllMocks();
        system.currentTick = 0;
        understudy = new Understudy('TestBot');
    });

    describe('constructor', () => {
        it('stores understudy, type, intervalTicks, and startTick', () => {
            system.currentTick = 10;
            const action = new RepeatableAction(understudy, 'attack', 5);
            expect(action.understudy).toBe(understudy);
            expect(action.type).toBe('attack');
            expect(action.intervalTicks).toBe(5);
            expect(action.startTick).toBe(10);
        });

        it('defaults intervalTicks to 0', () => {
            const action = new RepeatableAction(understudy, 'attack');
            expect(action.intervalTicks).toBe(0);
        });
    });

    describe('setInterval', () => {
        it('updates intervalTicks', () => {
            const action = new RepeatableAction(understudy, 'attack', 5);
            action.setInterval(20);
            expect(action.intervalTicks).toBe(20);
        });
    });

    describe('isActionTick', () => {
        it('always returns true when intervalTicks is 0', () => {
            const action = new RepeatableAction(understudy, 'attack', 0);
            system.currentTick = 7;
            expect(action.isActionTick()).toBe(true);
        });

        it('returns true when elapsed ticks is a multiple of interval', () => {
            system.currentTick = 0;
            const action = new RepeatableAction(understudy, 'attack', 5);
            system.currentTick = 5;
            expect(action.isActionTick()).toBe(true);
        });

        it('returns false when elapsed ticks is not a multiple of interval', () => {
            system.currentTick = 0;
            const action = new RepeatableAction(understudy, 'attack', 5);
            system.currentTick = 3;
            expect(action.isActionTick()).toBe(false);
        });
    });

    describe('while connected', () => {
        beforeEach(() => {
            understudy.join({ location: { x: 0, y: 0, z: 0 }, dimension: world.getDimension('overworld') });
        });

        describe('onTick', () => {
            it('calls perform when isActionTick returns true', () => {
                const action = new RepeatableAction(understudy, REPEATABLE_ACTIONS.ATTACK, 0);
                action.onTick();
                expect(action.understudy.simulatedPlayer.attack).toHaveBeenCalled();
            });

            it('does not call perform when isActionTick returns false', () => {
                system.currentTick = 0;
                const action = new RepeatableAction(understudy, REPEATABLE_ACTIONS.ATTACK, 5);
                system.currentTick = 3;
                action.onTick();
                expect(action.understudy.simulatedPlayer.attack).not.toHaveBeenCalled();
            });
        });

        describe('perform', () => {
            it('throws when understudy is not connected', () => {
                const offlineUnderstudy = new Understudy('OfflineBot');
                const action = new RepeatableAction(offlineUnderstudy, REPEATABLE_ACTIONS.ATTACK);
                expect(() => action.perform()).toThrow(UnderstudyNotConnectedError);
            });

            it('calls simulatedPlayer.attack() for ATTACK', () => {
                const action = new RepeatableAction(understudy, REPEATABLE_ACTIONS.ATTACK);
                action.perform();
                expect(action.understudy.simulatedPlayer.attack).toHaveBeenCalled();
            });

            it('calls simulatedPlayer.interact() for INTERACT', () => {
                const action = new RepeatableAction(understudy, REPEATABLE_ACTIONS.INTERACT);
                action.perform();
                expect(action.understudy.simulatedPlayer.interact).toHaveBeenCalled();
            });

            it('calls simulatedPlayer.useItemInSlot() for USE', () => {
                const action = new RepeatableAction(understudy, REPEATABLE_ACTIONS.USE);
                action.perform();
                expect(action.understudy.simulatedPlayer.useItemInSlot).toHaveBeenCalled();
            });

            it('makes the simulated player build for BUILD', () => {
                const action = new RepeatableAction(understudy, REPEATABLE_ACTIONS.BUILD);
                action.perform();
                expect(action.understudy.simulatedPlayer.startBuild).toHaveBeenCalled();
            });

            it('makes the simulated player break when looking at a block for BREAK', () => {
                const action = new RepeatableAction(understudy, REPEATABLE_ACTIONS.BREAK);
                understudy.simulatedPlayer.getBlockFromViewDirection.mockReturnValue({ block: { location: { x: 1, y: 64, z: 1 } } });
                action.perform();
                expect(action.understudy.simulatedPlayer.breakBlock).toHaveBeenCalled();
            });

            it('does not attempt to break when not looking at a block for BREAK', () => {
                const action = new RepeatableAction(understudy, REPEATABLE_ACTIONS.BREAK);
                understudy.simulatedPlayer.getBlockFromViewDirection.mockReturnValue(undefined);
                action.perform();
                expect(action.understudy.simulatedPlayer.breakBlock).not.toHaveBeenCalled();
            });

            it('makes the simulated player drop a single item for DROP', () => {
                const action = new RepeatableAction(understudy, REPEATABLE_ACTIONS.DROP);
                understudy.getInventory().setItem(0, { typeId: 'minecraft:stone', amount: 1 });
                action.perform();
                expect(action.understudy.simulatedPlayer.dropSelectedItem).toHaveBeenCalled();
            });

            it('does not attempt to drop when not holding an item for DROP', () => {
                const action = new RepeatableAction(understudy, REPEATABLE_ACTIONS.DROP);
                understudy.getInventory().setItem(0, undefined);
                action.perform();
                expect(action.understudy.simulatedPlayer.dropSelectedItem).not.toHaveBeenCalled();
            });

            it('calls simulatedPlayer.dropSelectedItem() for DROP_STACK', () => {
                const action = new RepeatableAction(understudy, REPEATABLE_ACTIONS.DROP_STACK);
                action.perform();
                expect(action.understudy.simulatedPlayer.dropSelectedItem).toHaveBeenCalled();
            });

            it('makes the simulated player drop all items for DROP_ALL', () => {
                const action = new RepeatableAction(understudy, REPEATABLE_ACTIONS.DROP_ALL);
                action.perform();
                const inventory = understudy.getInventory();
                expect(inventory.setItem).toHaveBeenCalledWith(0, undefined);
            });

            it('calls simulatedPlayer.jump() for JUMP', () => {
                const action = new RepeatableAction(understudy, REPEATABLE_ACTIONS.JUMP);
                action.perform();
                expect(action.understudy.simulatedPlayer.jump).toHaveBeenCalled();
            });

            it('throws an error for an unknown action type', () => {
                const action = new RepeatableAction(understudy, 'unknownType');
                expect(() => action.perform()).toThrow(UnknownRepeatingActionError);
            });
        });
    });
});
