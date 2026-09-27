import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Player } from '@minecraft/server';
import { Extensions, PlayerCommandOrigin, VanillaCommands } from '../../../../../Canopy[BP]/scripts/lib/canopy/Canopy';

vi.mock('../../../../../Canopy[BP]/scripts/constants', () => ({
    PACK_VERSION: '1.2.3'
}));

import { getVersionMessage, versionCommand } from '../../../../../Canopy[BP]/scripts/src/commands/version';

describe('version command schema', () => {
    const command = VanillaCommands.getAll()
        .find(entry =>
            entry.customCommand.name === 'canopy:version'
        );

    it('registers canopy:version with no parameters', () => {
        expect(
            command.customCommand.mandatoryParameters
        ).toBeUndefined();

        expect(
            command.customCommand.optionalParameters
        ).toBeUndefined();
    });
});

describe('version command output', () => {
    let player;
    let origin;

    beforeEach(() => {
        vi.restoreAllMocks();

        player = new Player();
        player.name = 'TestPlayer';

        origin = new PlayerCommandOrigin({
            sourceEntity: player
        });
    });

    it('reports the Canopy version', () => {
        vi.spyOn(
            Extensions,
            'getVersionedNames'
        ).mockReturnValue([]);

        expect(
            getVersionMessage()
        ).toEqual({
            rawtext: [
                {
                    translate: 'commands.canopy.version.message'
                },
                {
                    text: ' §av1.2.3§r§7.\n'
                }
            ]
        });
    });

    it('reports loaded extension versions', () => {
        vi.spyOn(
            Extensions,
            'getVersionedNames'
        ).mockReturnValue([
            {
                name: 'Example',
                version: '2.0.0'
            }
        ]);

        expect(
            getVersionMessage()
        ).toEqual({
            rawtext: [
                {
                    translate: 'commands.canopy.version.message'
                },
                {
                    text: ' §av1.2.3§r§7.\n'
                },
                {
                    translate: 'commands.canopy.version.extensions'
                },
                {
                    text: ' §2§oExample v2.0.0'
                }
            ]
        });
    });

    it('sends the version message and succeeds', () => {
        vi.spyOn(
            Extensions,
            'getVersionedNames'
        ).mockReturnValue([]);

        expect(
            versionCommand(origin)
        ).toEqual({
            status: 'Success'
        });

        expect(
            player.sendMessage
        ).toHaveBeenCalledWith({
            rawtext: [
                {
                    translate: 'commands.canopy.version.message'
                },
                {
                    text: ' §av1.2.3§r§7.\n'
                }
            ]
        });
    });
});
