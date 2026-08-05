import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Player } from '@minecraft/server';
import { PlayerCommandOrigin, Rules, InfoDisplayRule } from '../../../../../Canopy[BP]/scripts/lib/canopy/Canopy';
import { InfoDisplayCommand, infoCommand } from '../../../../../Canopy[BP]/scripts/src/commands/info';
import { InfoDisplay } from '../../../../../Canopy[BP]/scripts/src/rules/infodisplay/InfoDisplay';

describe('InfoDisplayCommand.getRuleEnumValues', () => {
    it('returns every InfoDisplay rule identifier followed by menu', () => {
        expect(InfoDisplayCommand.getRuleEnumValues()).toEqual([...InfoDisplay.getRuleIdentifiers(), 'menu']);
    });
});

describe('infoCommand dispatch', () => {
    let mockPlayer;
    let playerOrigin;

    beforeEach(() => {
        mockPlayer = new Player();
        mockPlayer.name = 'TestPlayer';
        playerOrigin = new PlayerCommandOrigin({ sourceEntity: mockPlayer });
    });

    it('returns Success for menu', () => {
        expect(infoCommand.infoCommand(playerOrigin, 'menu')).toEqual({ status: 'Success' });
    });

    it('returns Success for a rule toggle', () => {
        expect(infoCommand.infoCommand(playerOrigin, 'showCoords', true)).toEqual({ status: 'Success' });
    });
});

describe('infoCommand.handleRuleChange', () => {
    let player;

    beforeEach(() => {
        player = new Player();
        player.name = 'TestPlayer';
        vi.restoreAllMocks();
    });

    it('reports the current value when no value is given', async () => {
        vi.spyOn(InfoDisplayRule, 'exists').mockReturnValue(true);
        vi.spyOn(InfoDisplayRule, 'getValue').mockReturnValue(true);
        await infoCommand.handleRuleChange(player, 'showCoords', null);
        expect(player.sendMessage).toHaveBeenCalledWith({
            rawtext: [
                { translate: 'rules.generic.status', with: ['showCoords'] },
                { translate: 'rules.generic.enabled' },
                { text: '§r§7.' }
            ]
        });
    });

    it('sends the unknown message for a rule that does not exist at all', async () => {
        vi.spyOn(InfoDisplayRule, 'exists').mockReturnValue(false);
        vi.spyOn(Rules, 'exists').mockReturnValue(false);
        await infoCommand.handleRuleChange(player, 'nonExistent', true);
        expect(player.sendMessage).toHaveBeenCalledWith({
            rawtext: [{ translate: 'rules.generic.unknown', with: ['nonExistent', './'] }]
        });
    });

    it('sends the canopyRule message for a non-InfoDisplay rule that exists', async () => {
        vi.spyOn(InfoDisplayRule, 'exists').mockReturnValue(false);
        vi.spyOn(Rules, 'exists').mockReturnValue(true);
        await infoCommand.handleRuleChange(player, 'commandTick', true);
        expect(player.sendMessage).toHaveBeenCalledWith({
            translate: 'commands.info.canopyRule', with: ['commandTick', './']
        });
    });
});
