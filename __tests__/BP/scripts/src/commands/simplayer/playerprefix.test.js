import { vi, describe, it, expect, beforeEach } from 'vitest';
import { system, CustomCommandStatus } from '@minecraft/server';
import Understudies from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies';
import { playerprefixCommand } from '../../../../../../Canopy[BP]/scripts/src/commands/simplayer/playerprefix';

vi.mock('../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies', () => ({
    default: {
        setNametagPrefix: vi.fn(),
    }
}));

vi.mock('../../../../../../Canopy[BP]/scripts/lib/canopy/Canopy', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, VanillaCommand: vi.fn() };
});

describe('playerprefixCommand', () => {
    let mockOrigin;

    beforeEach(() => {
        vi.clearAllMocks();
        mockOrigin = { sendMessage: vi.fn() };
    });

    it('clears the prefix and returns success message when "-none" is passed', () => {
        const result = playerprefixCommand.playerprefixCommand(mockOrigin, '-none');
        expect(result.status).toBe(CustomCommandStatus.Success);
        expect(result.message).toBe('commands.playerprefix.removed');
        expect(system.run).toHaveBeenCalled();
    });

    it('sets the prefix and returns success message with the new prefix', () => {
        const result = playerprefixCommand.playerprefixCommand(mockOrigin, 'Bot');
        expect(result.status).toBe(CustomCommandStatus.Success);
        expect(mockOrigin.sendMessage).toHaveBeenCalledWith({ translate: 'commands.playerprefix.set', with: ['Bot'] });
        expect(system.run).toHaveBeenCalled();
    });
});
