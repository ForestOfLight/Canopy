import { vi, describe, it, expect, beforeEach } from 'vitest';
import { system, CustomCommandStatus } from '@minecraft/server';
import Understudies from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies';
import { playerrejoinCommand } from '../../../../../../Canopy[BP]/scripts/src/commands/simplayer/playerrejoin';

vi.mock('../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies', () => ({
    default: {
        get: vi.fn(),
        isOnline: vi.fn(() => false),
        create: vi.fn(),
        addNametagPrefix: vi.fn(),
        getNotOnlineMessage: vi.fn(name => `§cSimplayer '${name}' is not online.`),
        getAlreadyOnlineMessage: vi.fn(name => `§cSimplayer '${name}' is already online.`),
    }
}));

vi.mock('../../../../../../Canopy[BP]/scripts/lib/canopy/Canopy', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, VanillaCommand: vi.fn() };
});

describe('playerrejoinCommand', () => {
    let mockUnderstudy;
    let mockOrigin;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUnderstudy = { rejoin: vi.fn(), join: vi.fn(), name: 'TestBot' };
        vi.mocked(Understudies.create).mockReturnValue(mockUnderstudy);
        vi.mocked(Understudies.isOnline).mockReturnValue(false);
        mockOrigin = {
            getSource: vi.fn(() => ({
                location: { x: 0, y: 64, z: 0 },
                dimension: {},
                getRotation: vi.fn(() => ({ x: 0, y: 0 })),
                getGameMode: vi.fn(() => 'Survival')
            }))
        };
    });

    it('returns failure when the simplayer is already online', () => {
        vi.mocked(Understudies.isOnline).mockReturnValue(true);
        const result = playerrejoinCommand.playerrejoinCommand(mockOrigin, 'TestBot');
        expect(result.status).toBe(CustomCommandStatus.Failure);
        expect(result.message).toContain('TestBot');
    });

    it('returns success and queues rejoin when the simplayer is offline', () => {
        const result = playerrejoinCommand.playerrejoinCommand(mockOrigin, 'TestBot');
        expect(result.status).toBe(CustomCommandStatus.Success);
        expect(system.run).toHaveBeenCalled();
    });
});
