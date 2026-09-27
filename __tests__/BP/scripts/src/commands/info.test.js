import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomCommandParamType, Player } from '@minecraft/server';
import { PlayerCommandOrigin, Rules, InfoDisplayRule } from '../../../../../Canopy[BP]/scripts/lib/canopy/Canopy';
import { InfoDisplayCommand, infoCommand } from '../../../../../Canopy[BP]/scripts/src/commands/info';
import { InfoDisplay } from '../../../../../Canopy[BP]/scripts/src/rules/infodisplay/InfoDisplay';

describe('InfoDisplayCommand.getRuleEnumValues', () => {
    it('returns every InfoDisplay rule identifier followed by menu', () => {
        expect(InfoDisplayCommand.getRuleEnumValues()).toEqual([...InfoDisplay.getRuleIdentifiers(), 'menu']);
    });
});

describe('infoCommand schema', () => {
    it('allows the command to run without a rule and keeps the value optional', () => {
        expect(infoCommand.customCommand.mandatoryParameters).toBeUndefined();
        expect(infoCommand.customCommand.optionalParameters).toEqual([
            { name: 'canopy:infoRule', type: CustomCommandParamType.Enum },
            { name: 'value', type: CustomCommandParamType.Boolean }
        ]);
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

    it('returns Success with no rule', () => {
        expect(infoCommand.infoCommand(playerOrigin)).toEqual({ status: 'Success' });
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

    it('reports the current value and description when no value is given', async () => {
        const rule = {
            getID: () => 'showCoords',
            getValue: () => true,
            getDescription: () => ({ text: 'Shows coordinates.' })
        };

        vi.spyOn(InfoDisplayRule, 'exists').mockReturnValue(true);
        vi.spyOn(InfoDisplayRule, 'getValue').mockReturnValue(true);
        vi.spyOn(InfoDisplayRule, 'get').mockReturnValue(rule);

        await infoCommand.handleRuleChange(player, 'showCoords', null);

        expect(player.sendMessage).toHaveBeenCalledWith({
            rawtext: [
                { text: '§7showCoords: §atrue§r§8 - ' },
                { text: 'Shows coordinates.' }
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

describe('infoCommand.printRules', () => {
    it('prints every rule with its current state and description', () => {
        const player = new Player();
        const rules = [
            {
                getID: () => 'alpha',
                getValue: () => false,
                getDescription: () => ({ text: 'Alpha rule.' })
            },
            {
                getID: () => 'beta',
                getValue: () => true,
                getDescription: () => ({ text: 'Beta rule.' })
            }
        ];

        vi.spyOn(infoCommand, 'getRulesInAlphabeticalOrder').mockReturnValue(rules);

        infoCommand.printRules(player);

        expect(player.sendMessage).toHaveBeenCalledWith({
            rawtext: [
                { translate: 'commands.help.page.header', with: ['InfoDisplay'] },
                {
                    rawtext: [
                        { text: '\n  ' },
                        {
                            rawtext: [
                                { text: '§7alpha: §cfalse§r§8 - ' },
                                { text: 'Alpha rule.' }
                            ]
                        }
                    ]
                },
                {
                    rawtext: [
                        { text: '\n  ' },
                        {
                            rawtext: [
                                { text: '§7beta: §atrue§r§8 - ' },
                                { text: 'Beta rule.' }
                            ]
                        }
                    ]
                }
            ]
        });
    });
});
