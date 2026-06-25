import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CustomCommandStatus } from '@minecraft/server';
import Understudies from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies';
import { playeractionCommand } from '../../../../../../Canopy[BP]/scripts/src/commands/simplayer/playeraction';
import { REPEATABLE_ACTIONS, TIMING_OPTIONS } from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/RepeatableAction';

vi.mock('../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies', () => ({
    default: {
        get: vi.fn(),
        getNotOnlineMessage: vi.fn(name => ({ translate: 'simplayer.notonline', with: [name] })),
    }
}));

vi.mock('../../../../../../Canopy[BP]/scripts/lib/canopy/Canopy', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, VanillaCommand: vi.fn() };
});

describe('playeractionCommand', () => {
    let mockActions;
    let mockUnderstudy;
    let mockOrigin;

    beforeEach(() => {
        vi.clearAllMocks();
        mockActions = {
            once: vi.fn(),
            repeat: vi.fn(),
            remove: vi.fn(),
        };
        mockUnderstudy = { name: 'TestBot', actions: mockActions };
        mockOrigin = { sendMessage: vi.fn() };
    });

    it('returns failure when the simplayer is not online', () => {
        vi.mocked(Understudies.get).mockReturnValue(undefined);
        const result = playeractionCommand.playeractionCommand(mockOrigin, 'TestBot', REPEATABLE_ACTIONS.ATTACK);
        expect(result).toBeUndefined();
        expect(mockOrigin.sendMessage).toHaveBeenCalledWith({ translate: 'simplayer.notonline', with: ['TestBot'] });
    });

    it('queues a once action with ONCE timing (default)', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playeractionCommand.playeractionCommand(mockOrigin, 'TestBot', REPEATABLE_ACTIONS.ATTACK, TIMING_OPTIONS.ONCE);
        expect(mockActions.once).toHaveBeenCalledWith(REPEATABLE_ACTIONS.ATTACK);
        expect(result.status).toBe(CustomCommandStatus.Success);
    });

    it('returns failure for AFTER timing without ticks', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playeractionCommand.playeractionCommand(mockOrigin, 'TestBot', REPEATABLE_ACTIONS.ATTACK, TIMING_OPTIONS.AFTER, undefined);
        expect(result).toBeUndefined();
        expect(mockOrigin.sendMessage).toHaveBeenCalledWith({ translate: 'commands.playeraction.invalidticks', with: [TIMING_OPTIONS.AFTER, 'undefined'] });
    });

    it('queues a delayed once action with AFTER timing', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playeractionCommand.playeractionCommand(mockOrigin, 'TestBot', REPEATABLE_ACTIONS.ATTACK, TIMING_OPTIONS.AFTER, 10);
        expect(mockActions.once).toHaveBeenCalledWith(REPEATABLE_ACTIONS.ATTACK, 10);
        expect(result.status).toBe(CustomCommandStatus.Success);
    });

    it('queues a repeating action with CONTINUOUS timing', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playeractionCommand.playeractionCommand(mockOrigin, 'TestBot', REPEATABLE_ACTIONS.ATTACK, TIMING_OPTIONS.CONTINUOUS);
        expect(mockActions.repeat).toHaveBeenCalledWith(REPEATABLE_ACTIONS.ATTACK);
        expect(result.status).toBe(CustomCommandStatus.Success);
    });

    it('returns failure for INTERVAL timing without ticks', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playeractionCommand.playeractionCommand(mockOrigin, 'TestBot', REPEATABLE_ACTIONS.ATTACK, TIMING_OPTIONS.INTERVAL, undefined);
        expect(result).toBeUndefined();
        expect(mockOrigin.sendMessage).toHaveBeenCalledWith({ translate: 'commands.playeraction.invalidticks', with: [TIMING_OPTIONS.INTERVAL, 'undefined'] });
    });

    it('queues an interval repeating action with INTERVAL timing', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playeractionCommand.playeractionCommand(mockOrigin, 'TestBot', REPEATABLE_ACTIONS.ATTACK, TIMING_OPTIONS.INTERVAL, 20);
        expect(mockActions.repeat).toHaveBeenCalledWith(REPEATABLE_ACTIONS.ATTACK, 20);
        expect(result.status).toBe(CustomCommandStatus.Success);
    });

    it('removes a repeating action with STOP timing', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playeractionCommand.playeractionCommand(mockOrigin, 'TestBot', REPEATABLE_ACTIONS.ATTACK, TIMING_OPTIONS.STOP);
        expect(mockActions.remove).toHaveBeenCalledWith(REPEATABLE_ACTIONS.ATTACK);
        expect(result.status).toBe(CustomCommandStatus.Success);
    });

    it('returns failure for invalid timing option', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playeractionCommand.playeractionCommand(mockOrigin, 'TestBot', REPEATABLE_ACTIONS.ATTACK, 'invalid');
        expect(result).toBeUndefined();
        expect(mockOrigin.sendMessage).toHaveBeenCalledWith({ translate: 'commands.playeraction.invalidtiming', with: [REPEATABLE_ACTIONS.ATTACK, 'invalid'] });
    });

    it('defaults to ONCE timing when no timing option is provided', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        playeractionCommand.playeractionCommand(mockOrigin, 'TestBot', REPEATABLE_ACTIONS.ATTACK);
        expect(mockActions.once).toHaveBeenCalledWith(REPEATABLE_ACTIONS.ATTACK);
    });
});
