import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CustomCommandStatus } from '@minecraft/server';
import Understudies from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies';
import { playerselectCommand } from '../../../../../../Canopy[BP]/scripts/src/commands/simplayer/playerselect';

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

describe('playerselectCommand', () => {
    let mockTimeline;
    let mockUnderstudy;
    let mockOrigin;

    beforeEach(() => {
        vi.clearAllMocks();
        mockTimeline = { addOneShot: vi.fn() };
        mockUnderstudy = { name: 'TestBot', actions: { timeline: mockTimeline } };
        mockOrigin = { sendMessage: vi.fn() };
    });

    it('returns failure when the simplayer is not online', () => {
        vi.mocked(Understudies.get).mockReturnValue(undefined);
        const result = playerselectCommand.playerselectCommand(mockOrigin, 'TestBot', 0);
        expect(result).toBeUndefined();
        expect(mockOrigin.sendMessage).toHaveBeenCalledWith({ translate: 'simplayer.notonline', with: ['TestBot'] });
    });

    it('returns failure when slot number is less than 0', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playerselectCommand.playerselectCommand(mockOrigin, 'TestBot', -1);
        expect(result).toBeUndefined();
        expect(mockOrigin.sendMessage).toHaveBeenCalledWith({ translate: 'commands.playerselect.invalidslot', with: ['-1'] });
    });

    it('returns failure when slot number is greater than 8', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playerselectCommand.playerselectCommand(mockOrigin, 'TestBot', 9);
        expect(result).toBeUndefined();
        expect(mockOrigin.sendMessage).toHaveBeenCalledWith({ translate: 'commands.playerselect.invalidslot', with: ['9'] });
        expect(mockTimeline.addOneShot).not.toHaveBeenCalled();
    });

    it('returns success and adds a select event for slot 0', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playerselectCommand.playerselectCommand(mockOrigin, 'TestBot', 0);
        expect(result.status).toBe(CustomCommandStatus.Success);
        expect(mockTimeline.addOneShot).toHaveBeenCalledWith('select', { slot: 0 }, { delay: 0 });
    });

    it('returns success and adds a select event for slot 8', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playerselectCommand.playerselectCommand(mockOrigin, 'TestBot', 8);
        expect(result.status).toBe(CustomCommandStatus.Success);
        expect(mockTimeline.addOneShot).toHaveBeenCalledWith('select', { slot: 8 }, { delay: 0 });
    });
});
