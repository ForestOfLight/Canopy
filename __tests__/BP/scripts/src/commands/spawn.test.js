import { describe, expect, it } from 'vitest';
import { CustomCommandParamType } from '@minecraft/server';
import { VanillaCommands } from '../../../../../Canopy[BP]/scripts/lib/canopy/Canopy';
import '../../../../../Canopy[BP]/scripts/src/commands/spawn';

describe('spawn native command migration', () => {
    const command = VanillaCommands.getAll()
        .find(entry => entry.customCommand.name === 'canopy:spawn');

    it('preserves the optional legacy action arguments', () => {
        expect(command.customCommand.mandatoryParameters).toBeUndefined();

        expect(command.customCommand.optionalParameters.slice(0, 2)).toEqual([
            {
                name: 'canopy:spawnAction',
                type: CustomCommandParamType.Enum
            },
            {
                name: 'actionTwo',
                type: CustomCommandParamType.String
            }
        ]);
    });

    it('preserves the six legacy float coordinate arguments', () => {
        expect(command.customCommand.optionalParameters.slice(2)).toEqual([
            { name: 'x1', type: CustomCommandParamType.Float },
            { name: 'y1', type: CustomCommandParamType.Float },
            { name: 'z1', type: CustomCommandParamType.Float },
            { name: 'x2', type: CustomCommandParamType.Float },
            { name: 'y2', type: CustomCommandParamType.Float },
            { name: 'z2', type: CustomCommandParamType.Float }
        ]);
    });
});
