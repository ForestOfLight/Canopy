import { vi, describe, it, expect, beforeEach } from 'vitest';
import { system, CustomCommandStatus } from '@minecraft/server';
import Understudies from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies';
import { playersneakCommand } from '../../../../../../Canopy[BP]/scripts/src/commands/simplayer/playersneak';

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

describe('playersneakCommand', () => {
    let mockTimeline;
    let mockUnderstudy;
    let mockOrigin;

    beforeEach(() => {
        vi.clearAllMocks();
        mockTimeline = { setLooping: vi.fn(), clearTrack: vi.fn() };
        mockUnderstudy = { name: 'TestBot', actions: { timeline: mockTimeline } };
        mockOrigin = { sendMessage: vi.fn() };
    });

    it('returns failure when the simplayer is not online', () => {
        vi.mocked(Understudies.get).mockReturnValue(undefined);
        const result = playersneakCommand.playersneakCommand(mockOrigin, 'TestBot', true);
        expect(result).toBeUndefined();
        expect(mockOrigin.sendMessage).toHaveBeenCalledWith({ translate: 'simplayer.notonline', with: ['TestBot'] });
    });

    it('holds sneak on every tick when true', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playersneakCommand.playersneakCommand(mockOrigin, 'TestBot', true);
        expect(result.status).toBe(CustomCommandStatus.Success);
        expect(mockTimeline.setLooping).toHaveBeenCalledWith('sneak', void 0, { length: 1, ticks: [0] });
        expect(system.run).not.toHaveBeenCalled();
    });

    it('clears the sneak track when false', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playersneakCommand.playersneakCommand(mockOrigin, 'TestBot', false);
        expect(result.status).toBe(CustomCommandStatus.Success);
        expect(mockTimeline.clearTrack).toHaveBeenCalledWith('sneak');
        expect(mockTimeline.setLooping).not.toHaveBeenCalled();
    });
});
