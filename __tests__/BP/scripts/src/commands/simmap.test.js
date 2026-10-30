import { describe, expect, it } from 'vitest';
import { CustomCommandParamType } from '@minecraft/server';
import { VanillaCommands } from '../../../../../Canopy[BP]/scripts/lib/canopy/Canopy';
import '../../../../../Canopy[BP]/scripts/src/commands/simmap';

describe('simmap native command refactor', () => {
    const command = VanillaCommands.getAll()
        .find(entry => entry.customCommand.name === 'canopy:simmap');

    it('registers a fully optional typed native command schema', () => {
        expect(command.customCommand.mandatoryParameters).toBeUndefined();

        expect(command.customCommand.optionalParameters).toEqual([
            { name: 'canopy:simmapAction', type: CustomCommandParamType.Enum },
            { name: 'distance', type: CustomCommandParamType.Integer },
            { name: 'canopy:dimension', type: CustomCommandParamType.Enum },
            { name: 'x', type: CustomCommandParamType.Float },
            { name: 'z', type: CustomCommandParamType.Float }
        ]);
    });

    it('uses the shared dimension enum without registering a duplicate', () => {
        expect(command.customCommand.enums).toEqual([
            {
                name: 'canopy:simmapAction',
                values: ['show', 'display', 'follow']
            }
        ]);

        expect(command.customCommand.optionalParameters[2]).toEqual({
            name: 'canopy:dimension',
            type: CustomCommandParamType.Enum
        });
    });
});
