import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CustomCommandStatus } from '@minecraft/server';
import Understudies from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies';
import { playerinventoryCommand } from '../../../../../../Canopy[BP]/scripts/src/commands/simplayer/playerinventory';

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

describe('playerinventoryCommand', () => {
    let mockUnderstudy;
    let mockOrigin;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUnderstudy = { name: 'TestBot', getInventory: vi.fn() };
        mockOrigin = { sendMessage: vi.fn() };
    });

    it('returns failure when the simplayer is not online', () => {
        vi.mocked(Understudies.get).mockReturnValue(undefined);
        const result = playerinventoryCommand.playerinventoryCommand(mockOrigin, 'TestBot');
        expect(result.status).toBe(CustomCommandStatus.Failure);
        expect(mockOrigin.sendMessage).toHaveBeenCalledWith({ translate: 'simplayer.notonline', with: ['TestBot'] });
    });

    it('returns success with no-inventory message when inventory is absent', () => {
        mockUnderstudy.getInventory.mockReturnValue(undefined);
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playerinventoryCommand.playerinventoryCommand(mockOrigin, 'TestBot');
        expect(result.status).toBe(CustomCommandStatus.Success);
        expect(result.message).toBe('commands.playerinventory.noinventory');
    });

    it('returns success with empty message when all slots are empty', () => {
        mockUnderstudy.getInventory.mockReturnValue({ size: 36, emptySlotsCount: 36, getItem: vi.fn(() => undefined) });
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playerinventoryCommand.playerinventoryCommand(mockOrigin, 'TestBot');
        expect(result.status).toBe(CustomCommandStatus.Success);
        expect(mockOrigin.sendMessage).toHaveBeenCalledWith({ translate: 'commands.playerinventory.empty', with: ['TestBot'] });
    });

    it('lists items when inventory has contents', () => {
        const mockInventory = {
            size: 36,
            emptySlotsCount: 35,
            getItem: vi.fn(i => i === 0 ? { typeId: 'minecraft:stone', amount: 64 } : undefined)
        };
        mockUnderstudy.getInventory.mockReturnValue(mockInventory);
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playerinventoryCommand.playerinventoryCommand(mockOrigin, 'TestBot');
        expect(result.status).toBe(CustomCommandStatus.Success);
        expect(mockOrigin.sendMessage).toHaveBeenCalledWith({
            rawtext: [
                { translate: 'commands.playerinventory.header', with: ['TestBot'] },
                { text: '\n' },
                { translate: 'commands.playerinventory.item', with: ['§a', '0', 'minecraft:stone', '64'] }
            ]
        });
    });

    it('uses hotbar color code for slots 0-9', () => {
        const mockInventory = {
            size: 36,
            emptySlotsCount: 35,
            getItem: vi.fn(i => i === 0 ? { typeId: 'minecraft:stone', amount: 1 } : undefined)
        };
        mockUnderstudy.getInventory.mockReturnValue(mockInventory);
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        playerinventoryCommand.playerinventoryCommand(mockOrigin, 'TestBot');
        expect(mockOrigin.sendMessage).toHaveBeenCalledWith({
            rawtext: [
                { translate: 'commands.playerinventory.header', with: ['TestBot'] },
                { text: '\n' },
                { translate: 'commands.playerinventory.item', with: ['§a', '0', 'minecraft:stone', '1'] }
            ]
        });
    });
});
