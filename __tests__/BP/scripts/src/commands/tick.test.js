import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tickCommand, TICK_ACTIONS, VANILLA_MSPT } from '../../../../../Canopy[BP]/scripts/src/commands/tick';
import { world, Player } from '@minecraft/server';
import { PlayerCommandOrigin } from '../../../../../Canopy[BP]/scripts/lib/canopy/Canopy';

vi.mock('../../../../../Canopy[BP]/scripts/src/classes/Profiler', () => ({
    Profiler: { lastTickDate: 0 }
}));

describe('tickCommand', () => {
    let mockPlayer;
    let mockOrigin;

    beforeEach(() => {
        mockPlayer = new Player();
        mockPlayer.name = 'TestPlayer';
        mockOrigin = new PlayerCommandOrigin({ sourceEntity: mockPlayer });
        tickCommand.targetMSPT = VANILLA_MSPT;
        tickCommand.shouldStep = 0;
    });

    it('returns Failure for an unknown action', () => {
        expect(tickCommand.tickCommand(mockOrigin, 'invalid')).toEqual({
            status: 'Failure',
            message: 'commands.generic.invalidaction'
        });
    });

    describe('mspt', () => {
        it('returns Failure when mspt is below VANILLA_MSPT', () => {
            expect(tickCommand.tickCommand(mockOrigin, TICK_ACTIONS.MSPT, 49)).toEqual({
                status: 'Failure',
                message: 'commands.tick.mspt.fail'
            });
        });

        it('sets targetMSPT when mspt is valid', () => {
            tickCommand.tickCommand(mockOrigin, TICK_ACTIONS.MSPT, 100);
            expect(tickCommand.targetMSPT).toBe(100);
        });

        it('broadcasts success when mspt is valid', () => {
            tickCommand.tickCommand(mockOrigin, TICK_ACTIONS.MSPT, 100);
            expect(world.sendMessage).toHaveBeenCalledWith({
                translate: 'commands.tick.mspt.success',
                with: ['TestPlayer', '100']
            });
        });
    });

    describe('reset', () => {
        it('resets targetMSPT to VANILLA_MSPT', () => {
            tickCommand.targetMSPT = 100;
            tickCommand.tickCommand(mockOrigin, TICK_ACTIONS.RESET);
            expect(tickCommand.targetMSPT).toBe(VANILLA_MSPT);
        });

        it('broadcasts reset success', () => {
            tickCommand.tickCommand(mockOrigin, TICK_ACTIONS.RESET);
            expect(world.sendMessage).toHaveBeenCalledWith({
                translate: 'commands.tick.reset.success',
                with: ['TestPlayer']
            });
        });
    });

    describe('step', () => {
        it('sends private failure when tick is not slowed', () => {
            tickCommand.tickCommand(mockOrigin, TICK_ACTIONS.STEP);
            expect(mockPlayer.sendMessage).toHaveBeenCalledWith({
                translate: 'commands.tick.step.fail'
            });
        });

        it('defaults to 1 step when no value is given', () => {
            tickCommand.targetMSPT = 100;
            tickCommand.tickCommand(mockOrigin, TICK_ACTIONS.STEP);
            expect(tickCommand.shouldStep).toBe(1);
        });

        it('defaults to 1 step when value is 0', () => {
            tickCommand.targetMSPT = 100;
            tickCommand.tickCommand(mockOrigin, TICK_ACTIONS.STEP, 0);
            expect(tickCommand.shouldStep).toBe(1);
        });

        it('sets shouldStep to the given value', () => {
            tickCommand.targetMSPT = 100;
            tickCommand.tickCommand(mockOrigin, TICK_ACTIONS.STEP, 5);
            expect(tickCommand.shouldStep).toBe(5);
        });

        it('broadcasts step start with the step count', () => {
            tickCommand.targetMSPT = 100;
            tickCommand.tickCommand(mockOrigin, TICK_ACTIONS.STEP, 3);
            expect(world.sendMessage).toHaveBeenCalledWith({
                translate: 'commands.tick.step.start',
                with: ['TestPlayer', '3']
            });
        });
    });

    describe('sleep', () => {
        it('returns failure message when no milliseconds given', () => {
            expect(tickCommand.tickCommand(mockOrigin, TICK_ACTIONS.SLEEP)).toEqual({
                status: 'Success',
                message: 'commands.tick.sleep.fail'
            });
        });

        it('returns failure message when milliseconds is 0', () => {
            expect(tickCommand.tickCommand(mockOrigin, TICK_ACTIONS.SLEEP, 0)).toEqual({
                status: 'Success',
                message: 'commands.tick.sleep.fail'
            });
        });

        it('broadcasts sleep success when milliseconds is valid', () => {
            tickCommand.tickCommand(mockOrigin, TICK_ACTIONS.SLEEP, 10);
            expect(world.sendMessage).toHaveBeenCalledWith({
                translate: 'commands.tick.sleep.success',
                with: ['TestPlayer', '10']
            });
        });
    });
});
