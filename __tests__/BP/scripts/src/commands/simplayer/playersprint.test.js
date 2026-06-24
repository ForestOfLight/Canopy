import { vi, describe, it, expect, beforeEach } from 'vitest';
import { system, CustomCommandStatus } from '@minecraft/server';
import Understudies from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies';
import { playersprintCommand } from '../../../../../../Canopy[BP]/scripts/src/commands/simplayer/playersprint';

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

describe('playersprintCommand', () => {
    let mockUnderstudy;
    let mockOrigin;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUnderstudy = { sprint: vi.fn(), name: 'TestBot' };
        mockOrigin = { sendMessage: vi.fn() };
    });

    it('returns failure when the simplayer is not online', () => {
        vi.mocked(Understudies.get).mockReturnValue(undefined);
        const result = playersprintCommand.playersprintCommand(mockOrigin, 'TestBot', true);
        expect(result.status).toBe(CustomCommandStatus.Failure);
        expect(mockOrigin.sendMessage).toHaveBeenCalledWith({ translate: 'simplayer.notonline', with: ['TestBot'] });
    });

    it('returns success and queues sprint(true) when online', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playersprintCommand.playersprintCommand(undefined, 'TestBot', true);
        expect(result.status).toBe(CustomCommandStatus.Success);
        expect(system.run).toHaveBeenCalled();
    });

    it('returns success and queues sprint(false) when online', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playersprintCommand.playersprintCommand(undefined, 'TestBot', false);
        expect(result.status).toBe(CustomCommandStatus.Success);
        expect(system.run).toHaveBeenCalled();
    });
});
