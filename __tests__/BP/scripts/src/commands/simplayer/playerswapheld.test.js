import { vi, describe, it, expect, beforeEach } from 'vitest';
import { system, CustomCommandStatus } from '@minecraft/server';
import Understudies from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies';
import { playerswapheldCommand } from '../../../../../../Canopy[BP]/scripts/src/commands/simplayer/playerswapheld';

vi.mock('../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies', () => ({
    default: {
        get: vi.fn(),
        getNotOnlineMessage: vi.fn(name => `§cSimplayer '${name}' is not online.`),
    }
}));

vi.mock('../../../../../../Canopy[BP]/scripts/lib/canopy/Canopy', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, VanillaCommand: vi.fn() };
});

describe('playerswapheldCommand', () => {
    let mockUnderstudy;
    let mockOrigin;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUnderstudy = { swapHeldItemWithPlayer: vi.fn(), name: 'TestBot' };
        mockOrigin = { getSource: vi.fn(() => ({ name: 'Player1', selectedSlotIndex: 0 })) };
    });

    it('returns failure when the simplayer is not online', () => {
        vi.mocked(Understudies.get).mockReturnValue(undefined);
        const result = playerswapheldCommand.playerswapheldCommand(mockOrigin, 'TestBot');
        expect(result.status).toBe(CustomCommandStatus.Failure);
    });

    it('returns success and queues swap when online', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playerswapheldCommand.playerswapheldCommand(mockOrigin, 'TestBot');
        expect(result.status).toBe(CustomCommandStatus.Success);
        expect(system.run).toHaveBeenCalled();
    });
});
