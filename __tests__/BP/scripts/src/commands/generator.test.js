import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VanillaCommands } from '../../../../../Canopy[BP]/scripts/lib/canopy/Canopy';
import { generatorChannels } from '../../../../../Canopy[BP]/scripts/src/classes/GeneratorChannels';
import '../../../../../Canopy[BP]/scripts/src/commands/generator';

vi.mock('@minecraft/server', async (importOriginal) => {
    const original = await importOriginal();
    return {
        ...original,
        system: {
            ...original.system,
            run: vi.fn(callback => callback())
        }
    };
});

vi.mock('../../../../../Canopy[BP]/scripts/src/classes/GeneratorChannels', () => ({
    generatorChannels: {
        enable: vi.fn(),
        disable: vi.fn(),
        isValidColor: vi.fn(color => ['red', 'blue'].includes(color)),
        getQueryOutput: vi.fn(() => 'channel-output'),
        getAllQueryOutput: vi.fn(() => 'all-output'),
        resetCounts: vi.fn(),
        resetAllCounts: vi.fn(),
        removeHoppers: vi.fn(),
        removeAllHoppers: vi.fn()
    }
}));

describe('generator native command migration', () => {
    const command = VanillaCommands.getAll()
        .find(entry => entry.customCommand.name === 'canopy:generator');

    let player;
    let origin;

    beforeEach(() => {
        vi.clearAllMocks();

        player = {
            name: 'TestPlayer',
            sendMessage: vi.fn()
        };

        origin = {
            getSource: vi.fn(() => player)
        };
    });

    it('registers generator and gt with the native schema', () => {
        expect(command.customCommand.aliases).toEqual(['canopy:gt']);

        expect(command.customCommand.optionalParameters.map(parameter => parameter.name)).toEqual([
            'canopy:generatorTarget',
            'canopy:generatorAction'
        ]);

        expect(command.customCommand.enums[0].values).toContain('red');
        expect(command.customCommand.enums[0].values).toContain('all');
        expect(command.customCommand.enums[0].values).toContain('reset');
    });

    it('preserves bare generator as query all', () => {
        command.customCommand.callback(origin);

        expect(generatorChannels.getAllQueryOutput).toHaveBeenCalledWith(false);
        expect(player.sendMessage).toHaveBeenCalledWith('all-output');
    });

    it('preserves a bare color query', () => {
        command.customCommand.callback(origin, 'red');

        expect(generatorChannels.getQueryOutput).toHaveBeenCalledWith('red', false);
        expect(player.sendMessage).toHaveBeenCalledWith('channel-output');
    });

    it('preserves bare realtime as an all-channel realtime query', () => {
        command.customCommand.callback(origin, 'realtime');

        expect(generatorChannels.getAllQueryOutput).toHaveBeenCalledWith(true);
        expect(player.sendMessage).toHaveBeenCalledWith('all-output');
    });
});
