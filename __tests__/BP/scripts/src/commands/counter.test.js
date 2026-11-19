import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VanillaCommands } from '../../../../../Canopy[BP]/scripts/lib/canopy/Canopy';
import { counterChannels } from '../../../../../Canopy[BP]/scripts/src/classes/CounterChannels';
import '../../../../../Canopy[BP]/scripts/src/commands/counter';

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

vi.mock('../../../../../Canopy[BP]/scripts/src/classes/CounterChannels', () => ({
    counterChannels: {
        enable: vi.fn(),
        disable: vi.fn(),
        isValidMode: vi.fn(mode => ['count', 'hr', 'min', 'sec'].includes(mode)),
        isValidColor: vi.fn(color => ['red', 'blue'].includes(color)),
        getQueryOutput: vi.fn(() => 'channel-output'),
        getAllQueryOutput: vi.fn(() => 'all-output'),
        resetCounts: vi.fn(),
        resetAllCounts: vi.fn(),
        setMode: vi.fn(),
        setAllModes: vi.fn(),
        removeHoppers: vi.fn(),
        removeAllHoppers: vi.fn()
    }
}));

describe('counter native command migration', () => {
    const command = VanillaCommands.getAll()
        .find(entry => entry.customCommand.name === 'canopy:counter');

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

    it('registers counter and ct with the native schema', () => {
        expect(command.customCommand.aliases).toEqual(['canopy:ct']);

        expect(command.customCommand.optionalParameters.map(parameter => parameter.name)).toEqual([
            'canopy:counterTarget',
            'canopy:counterAction'
        ]);

        expect(command.customCommand.enums[0].values).toContain('red');
        expect(command.customCommand.enums[0].values).toContain('all');
        expect(command.customCommand.enums[0].values).toContain('hr');
    });

    it('preserves bare counter as query all', () => {
        command.customCommand.callback(origin);

        expect(counterChannels.getAllQueryOutput).toHaveBeenCalledWith(false);
        expect(player.sendMessage).toHaveBeenCalledWith('all-output');
    });

    it('preserves a bare color query', () => {
        command.customCommand.callback(origin, 'red');

        expect(counterChannels.getQueryOutput).toHaveBeenCalledWith('red', false);
        expect(player.sendMessage).toHaveBeenCalledWith('channel-output');
    });

    it('preserves a bare mode as an all-channel mode change', () => {
        command.customCommand.callback(origin, 'hr');

        expect(counterChannels.setAllModes).toHaveBeenCalledWith('hr');
    });
});
