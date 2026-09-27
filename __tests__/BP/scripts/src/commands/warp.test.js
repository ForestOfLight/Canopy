import { describe, expect, it } from 'vitest';
import { CustomCommandParamType } from '@minecraft/server';
import { VanillaCommands } from '../../../../../Canopy[BP]/scripts/lib/canopy/Canopy';
import '../../../../../Canopy[BP]/scripts/src/commands/warp';

describe('warp native command migration', () => {
    const commands = VanillaCommands.getAll();

    const warp = commands
        .find(entry => entry.customCommand.name === 'canopy:warp');

    const warps = commands
        .find(entry => entry.customCommand.name === 'canopy:warps');

    it('registers warp and w with string name parameters', () => {
        expect(warp.customCommand.aliases).toEqual(['canopy:w']);

        expect(warp.customCommand.mandatoryParameters).toEqual([
            {
                name: 'add/remove/name',
                type: CustomCommandParamType.String
            }
        ]);

        expect(warp.customCommand.optionalParameters).toEqual([
            {
                name: 'warp-name',
                type: CustomCommandParamType.String
            }
        ]);
    });

    it('registers warps as the native list command', () => {
        expect(warps).toBeDefined();
        expect(warps.customCommand.contingentRules).toEqual(['commandWarp']);
    });
});
