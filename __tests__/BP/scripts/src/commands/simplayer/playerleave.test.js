import { vi, describe, it, expect, beforeEach } from 'vitest';
import { system } from '@minecraft/server';
import Understudies from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies';
import { playerleaveCommand } from '../../../../../../Canopy[BP]/scripts/src/commands/simplayer/playerleave';

vi.mock('../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies', () => ({
    default: {
        get: vi.fn(),
        isOnline: vi.fn(() => false),
        remove: vi.fn(),
        getNotOnlineMessage: vi.fn(name => ({ translate: 'simplayer.notonline', with: [name] })),
        getAlreadyOnlineMessage: vi.fn(name => `§cSimplayer '${name}' is already online.`),
    }
}));

vi.mock('../../../../../../Canopy[BP]/scripts/lib/canopy/Canopy', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, VanillaCommand: vi.fn() };
});

describe('playerleaveCommand', () => {
    let mockUnderstudy;
    let mockOrigin;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUnderstudy = { leave: vi.fn(), name: 'TestBot' };
        mockOrigin = { sendMessage: vi.fn() };
    });

    it('returns failure when the simplayer is not online', () => {
        vi.mocked(Understudies.get).mockReturnValue(undefined);
        const result = playerleaveCommand.playerleaveCommand(mockOrigin, 'TestBot');
        expect(result).toBeUndefined();
        expect(mockOrigin.sendMessage).toHaveBeenCalledWith({ translate: 'simplayer.notonline', with: ['TestBot'] });
    });

    it('queues a system.run when the simplayer is online', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        playerleaveCommand.playerleaveCommand(mockOrigin, 'TestBot');
        expect(system.run).toHaveBeenCalled();
    });

    it('returns undefined (no explicit return) when the simplayer is online', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playerleaveCommand.playerleaveCommand(mockOrigin, 'TestBot');
        expect(result).toBeUndefined();
    });
});
