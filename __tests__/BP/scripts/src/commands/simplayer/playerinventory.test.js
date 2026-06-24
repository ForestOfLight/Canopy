import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CustomCommandStatus } from '@minecraft/server';
import Understudies from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies';
import { playerinventoryCommand } from '../../../../../../Canopy[BP]/scripts/src/commands/simplayer/playerinventory';

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

describe('playerinventoryCommand', () => {
    let mockUnderstudy;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUnderstudy = { name: 'TestBot', getInventory: vi.fn() };
    });

    it('returns failure when the simplayer is not online', () => {
        vi.mocked(Understudies.get).mockReturnValue(undefined);
        const result = playerinventoryCommand.playerinventoryCommand(undefined, 'TestBot');
        expect(result.status).toBe(CustomCommandStatus.Failure);
    });

    it('returns success with no-inventory message when inventory is absent', () => {
        mockUnderstudy.getInventory.mockReturnValue(undefined);
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playerinventoryCommand.playerinventoryCommand(undefined, 'TestBot');
        expect(result.status).toBe(CustomCommandStatus.Success);
        expect(result.message).toContain('No inventory found');
    });

    it('returns success with empty message when all slots are empty', () => {
        mockUnderstudy.getInventory.mockReturnValue({ size: 36, emptySlotsCount: 36, getItem: vi.fn(() => undefined) });
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playerinventoryCommand.playerinventoryCommand(undefined, 'TestBot');
        expect(result.status).toBe(CustomCommandStatus.Success);
        expect(result.message).toContain("TestBot's inventory is empty");
    });

    it('lists items when inventory has contents', () => {
        const mockInventory = {
            size: 36,
            emptySlotsCount: 35,
            getItem: vi.fn(i => i === 0 ? { typeId: 'minecraft:stone', amount: 64 } : undefined)
        };
        mockUnderstudy.getInventory.mockReturnValue(mockInventory);
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playerinventoryCommand.playerinventoryCommand(undefined, 'TestBot');
        expect(result.status).toBe(CustomCommandStatus.Success);
        expect(result.message).toContain('minecraft:stone');
        expect(result.message).toContain('64');
    });

    it('uses hotbar color code for slots 0-9', () => {
        const mockInventory = {
            size: 36,
            emptySlotsCount: 35,
            getItem: vi.fn(i => i === 0 ? { typeId: 'minecraft:stone', amount: 1 } : undefined)
        };
        mockUnderstudy.getInventory.mockReturnValue(mockInventory);
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playerinventoryCommand.playerinventoryCommand(undefined, 'TestBot');
        expect(result.message).toContain('§a0');
    });
});
