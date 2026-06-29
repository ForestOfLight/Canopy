import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Player } from '@minecraft/server';
import { PlayerCommandOrigin, ServerCommandOrigin, Rules, Extensions } from '../../../../../Canopy[BP]/scripts/lib/canopy/Canopy';

vi.mock('../../../../../Canopy[BP]/scripts/constants', () => ({ PACK_VERSION: '1.2.3' }));

import { CanopyCommand, canopyCommand } from '../../../../../Canopy[BP]/scripts/src/commands/canopy';

describe('CanopyCommand.parseValue', () => {
    it('parses booleans from strings', () => {
        expect(CanopyCommand.parseValue('true', 'boolean')).toBe(true);
        expect(CanopyCommand.parseValue('false', 'boolean')).toBe(false);
    });
    it('returns NaN for non-boolean strings on boolean rules', () => {
        expect(CanopyCommand.parseValue('yes', 'boolean')).toBeNaN();
    });
    it('parses integers and floats', () => {
        expect(CanopyCommand.parseValue('64', 'integer')).toBe(64);
        expect(CanopyCommand.parseValue('1.5', 'float')).toBe(1.5);
    });
    it('returns NaN for unparseable numbers', () => {
        expect(CanopyCommand.parseValue('abc', 'integer')).toBeNaN();
        expect(CanopyCommand.parseValue('abc', 'float')).toBeNaN();
    });
    it('returns null when no value is given', () => {
        expect(CanopyCommand.parseValue(null, 'boolean')).toBeNull();
    });
});

describe('CanopyCommand.getRuleEnumValues', () => {
    it('appends menu and version to the settable rule IDs', () => {
        vi.spyOn(Rules, 'getSettableRuleIDs').mockReturnValue(['foo', 'bar']);
        expect(CanopyCommand.getRuleEnumValues()).toEqual(['foo', 'bar', 'menu', 'version']);
    });
});

describe('canopyCommand dispatch', () => {
    let mockPlayer;
    let playerOrigin;
    let serverOrigin;

    beforeEach(() => {
        mockPlayer = new Player();
        mockPlayer.name = 'TestPlayer';
        playerOrigin = new PlayerCommandOrigin({ sourceEntity: mockPlayer });
        serverOrigin = new ServerCommandOrigin({});
    });

    it('rejects menu from a non-player origin', () => {
        expect(canopyCommand.canopyCommand(serverOrigin, 'menu')).toEqual({
            status: 'Failure',
            message: 'commands.generic.invalidsource'
        });
    });

    it('returns Success for menu from a player origin', () => {
        expect(canopyCommand.canopyCommand(playerOrigin, 'menu')).toEqual({ status: 'Success' });
    });

    it('sends the version message and returns Success for version', () => {
        vi.spyOn(Extensions, 'getVersionedNames').mockReturnValue([]);
        const result = canopyCommand.canopyCommand(playerOrigin, 'version');
        expect(result).toEqual({ status: 'Success' });
        expect(mockPlayer.sendMessage).toHaveBeenCalledWith({
            rawtext: [
                { translate: 'commands.canopy.version.message' },
                { text: ' §av1.2.3§r§7.\n' }
            ]
        });
    });

    it('returns Success for a rule change', () => {
        vi.spyOn(Rules, 'get').mockReturnValue({ getType: () => 'boolean' });
        expect(canopyCommand.canopyCommand(playerOrigin, 'commandTick', 'true')).toEqual({ status: 'Success' });
    });
});
