import { vi, describe, it, expect, beforeEach } from 'vitest';
import { system, CustomCommandStatus } from '@minecraft/server';
import Understudies from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies';
import { playerjoinCommand } from '../../../../../../Canopy[BP]/scripts/src/commands/simplayer/playerjoin';

vi.mock('../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies', () => ({
    default: {
        get: vi.fn(),
        isOnline: vi.fn(() => false),
        create: vi.fn(),
        remove: vi.fn(),
        addNametagPrefix: vi.fn(),
        getNotOnlineMessage: vi.fn(name => `§cSimplayer '${name}' is not online.`),
        getAlreadyOnlineMessage: vi.fn(name => ({ translate: 'simplayer.alreadyonline', with: [name] })),
    }
}));

vi.mock('../../../../../../Canopy[BP]/scripts/lib/canopy/Canopy', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, VanillaCommand: vi.fn() };
});

describe('playerjoinCommand', () => {
    let mockUnderstudy;
    let mockOrigin;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUnderstudy = { join: vi.fn(), name: 'TestBot' };
        vi.mocked(Understudies.create).mockReturnValue(mockUnderstudy);
        vi.mocked(Understudies.isOnline).mockReturnValue(false);
        mockOrigin = { getSource: vi.fn(() => ({ location: { x: 0, y: 64, z: 0 }, dimension: {}, getRotation: vi.fn(() => ({ x: 0, y: 0 })), getGameMode: vi.fn(() => 'Survival') })), sendMessage: vi.fn() };
    });

    it('returns failure when the simplayer is already online', () => {
        vi.mocked(Understudies.isOnline).mockReturnValue(true);
        const result = playerjoinCommand.playerjoinCommand(mockOrigin, 'TestBot');
        expect(result.status).toBe(CustomCommandStatus.Failure);
        expect(mockOrigin.sendMessage).toHaveBeenCalledWith({ translate: 'simplayer.alreadyonline', with: ['TestBot'] });
    });

    it('queues a system.run when the simplayer is not online', () => {
        playerjoinCommand.playerjoinCommand(mockOrigin, 'TestBot');
        expect(system.run).toHaveBeenCalled();
    });

    it('returns undefined (no explicit return) when the simplayer is not online', () => {
        const result = playerjoinCommand.playerjoinCommand(mockOrigin, 'TestBot');
        expect(result).toBeUndefined();
    });
});
