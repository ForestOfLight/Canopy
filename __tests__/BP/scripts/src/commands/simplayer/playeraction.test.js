import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CustomCommandStatus } from '@minecraft/server';
import Understudies from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies';
import { playeractionCommand, TIMING_OPTIONS } from '../../../../../../Canopy[BP]/scripts/src/commands/simplayer/playeraction';
import { REPEATABLE_ACTIONS } from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/RepeatableAction';

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
    let mockTimeline;
    let mockUnderstudy;
    let mockOrigin;

    beforeEach(() => {
        vi.clearAllMocks();
        mockTimeline = {
            addOneShot: vi.fn(),
            setLooping: vi.fn(),
            clearTrack: vi.fn(),
        };
        mockUnderstudy = { name: 'TestBot', actions: { timeline: mockTimeline } };
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
        expect(mockTimeline.addOneShot).toHaveBeenCalledWith(REPEATABLE_ACTIONS.ATTACK, void 0, { delay: 0 });
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
        expect(mockTimeline.addOneShot).toHaveBeenCalledWith(REPEATABLE_ACTIONS.ATTACK, void 0, { delay: 10 });
        expect(result.status).toBe(CustomCommandStatus.Success);
    });

    it('queues a repeating action with CONTINUOUS timing', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playeractionCommand.playeractionCommand(mockOrigin, 'TestBot', REPEATABLE_ACTIONS.ATTACK, TIMING_OPTIONS.CONTINUOUS);
        expect(mockTimeline.setLooping).toHaveBeenCalledWith(REPEATABLE_ACTIONS.ATTACK, void 0, { length: 1, ticks: [0] });
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
        expect(mockTimeline.setLooping).toHaveBeenCalledWith(REPEATABLE_ACTIONS.ATTACK, void 0, { length: 20, ticks: [0] });
        expect(result.status).toBe(CustomCommandStatus.Success);
    });

    it('removes a repeating action with STOP timing', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playeractionCommand.playeractionCommand(mockOrigin, 'TestBot', REPEATABLE_ACTIONS.ATTACK, TIMING_OPTIONS.STOP);
        expect(mockTimeline.clearTrack).toHaveBeenCalledWith(REPEATABLE_ACTIONS.ATTACK);
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
        expect(mockTimeline.addOneShot).toHaveBeenCalledWith(REPEATABLE_ACTIONS.ATTACK, void 0, { delay: 0 });
    });

    it('treats an interval of 0 as every tick', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        playeractionCommand.playeractionCommand(mockOrigin, 'TestBot', REPEATABLE_ACTIONS.JUMP, TIMING_OPTIONS.INTERVAL, 0);
        expect(mockTimeline.setLooping).toHaveBeenCalledWith(REPEATABLE_ACTIONS.JUMP, void 0, { length: 1, ticks: [0] });
    });

    it.each([[TIMING_OPTIONS.INTERVAL, -3], [TIMING_OPTIONS.AFTER, -1]])('rejects %s with negative ticks %i', (timing, ticks) => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playeractionCommand.playeractionCommand(mockOrigin, 'TestBot', REPEATABLE_ACTIONS.JUMP, timing, ticks);
        expect(result).toBeUndefined();
        expect(mockOrigin.sendMessage).toHaveBeenCalledWith({ translate: 'commands.playeraction.invalidticks', with: [timing, String(ticks)] });
        expect(mockTimeline.setLooping).not.toHaveBeenCalled();
        expect(mockTimeline.addOneShot).not.toHaveBeenCalled();
    });
});
