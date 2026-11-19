import { describe, expect, it } from 'vitest';
import { CustomCommandParamType } from '@minecraft/server';
import { VanillaCommands } from '../../../../../Canopy[BP]/scripts/lib/canopy/Canopy';
import '../../../../../Canopy[BP]/scripts/src/commands/distance';

describe('distance native command migration', () => {
    const command = VanillaCommands.getAll()
        .find(entry => entry.customCommand.name === 'canopy:distance');

    it('registers distance and d with the native action schema', () => {
        expect(command.customCommand.aliases).toEqual(['canopy:d']);
        expect(command.customCommand.enums[0].values).toEqual([
            'target',
            'from',
            'to'
        ]);
        expect(command.customCommand.mandatoryParameters[0].name)
            .toBe('canopy:distanceAction');
    });

    it('preserves the two location positions around the optional to connector', () => {
        expect(command.customCommand.optionalParameters).toEqual([
            {
                name: 'location',
                type: CustomCommandParamType.Location
            },
            {
                name: 'canopy:distanceConnector',
                type: CustomCommandParamType.Enum
            },
            {
                name: 'location',
                type: CustomCommandParamType.Location
            }
        ]);
    });
});
