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
    let mockUnderstudy;
    let mockOrigin;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUnderstudy = { sneak: vi.fn(), name: 'TestBot' };
        mockOrigin = { sendMessage: vi.fn() };
    });

    it('returns failure when the simplayer is not online', () => {
        vi.mocked(Understudies.get).mockReturnValue(undefined);
        const result = playersneakCommand.playersneakCommand(mockOrigin, 'TestBot', true);
        expect(result).toBeUndefined();
        expect(mockOrigin.sendMessage).toHaveBeenCalledWith({ translate: 'simplayer.notonline', with: ['TestBot'] });
    });

    it('returns success and queues sneak(true) when online', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playersneakCommand.playersneakCommand(undefined, 'TestBot', true);
        expect(result.status).toBe(CustomCommandStatus.Success);
        expect(system.run).toHaveBeenCalled();
    });

    it('returns success and queues sneak(false) when online', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playersneakCommand.playersneakCommand(undefined, 'TestBot', false);
        expect(result.status).toBe(CustomCommandStatus.Success);
        expect(system.run).toHaveBeenCalled();
    });
});
