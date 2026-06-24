import { vi, describe, it, expect, beforeEach } from 'vitest';
import { system, CustomCommandStatus } from '@minecraft/server';
import Understudies from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies';
import { playertpCommand } from '../../../../../../Canopy[BP]/scripts/src/commands/simplayer/playertp';

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

describe('playertpCommand', () => {
    let mockUnderstudy;
    let mockOrigin;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUnderstudy = { teleport: vi.fn(), name: 'TestBot' };
        mockOrigin = { getSource: vi.fn(() => ({ location: { x: 0, y: 64, z: 0 }, dimension: {}, getRotation: vi.fn(() => ({ x: 0, y: 0 })), getGameMode: vi.fn(() => 'Survival') })), sendMessage: vi.fn() };
    });

    it('returns failure when the simplayer is not online', () => {
        vi.mocked(Understudies.get).mockReturnValue(undefined);
        const result = playertpCommand.playertpCommand(mockOrigin, 'TestBot');
        expect(result.status).toBe(CustomCommandStatus.Failure);
        expect(mockOrigin.sendMessage).toHaveBeenCalledWith({ translate: 'simplayer.notonline', with: ['TestBot'] });
    });

    it('returns success when the simplayer is online', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playertpCommand.playertpCommand(mockOrigin, 'TestBot');
        expect(result.status).toBe(CustomCommandStatus.Success);
    });

    it('queues a system.run for the teleport', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        playertpCommand.playertpCommand(mockOrigin, 'TestBot');
        expect(system.run).toHaveBeenCalled();
    });
});
