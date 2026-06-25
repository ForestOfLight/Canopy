import { vi, describe, it, expect, beforeEach } from 'vitest';
import { system, CustomCommandStatus } from '@minecraft/server';
import Understudies from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies';
import { playerstopCommand } from '../../../../../../Canopy[BP]/scripts/src/commands/simplayer/playerstop';

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

describe('playerstopCommand', () => {
    let mockUnderstudy;
    let mockOrigin;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUnderstudy = { stopAll: vi.fn(), name: 'TestBot' };
        mockOrigin = { sendMessage: vi.fn() };
    });

    it('returns failure when the simplayer is not online', () => {
        vi.mocked(Understudies.get).mockReturnValue(undefined);
        const result = playerstopCommand.playerstopCommand(mockOrigin, 'TestBot');
        expect(result).toBeUndefined();
        expect(mockOrigin.sendMessage).toHaveBeenCalledWith({ translate: 'simplayer.notonline', with: ['TestBot'] });
    });

    it('returns success and queues stopAll when online', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playerstopCommand.playerstopCommand(undefined, 'TestBot');
        expect(result.status).toBe(CustomCommandStatus.Success);
        expect(system.run).toHaveBeenCalled();
    });
});
