import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CommandPermissionLevel, CustomCommandParamType, Player } from '@minecraft/server';
import { PlayerCommandOrigin, Rules, ServerCommandOrigin } from '../../../../../Canopy[BP]/scripts/lib/canopy/Canopy';
import { RulesCommand, rulesCommand } from '../../../../../Canopy[BP]/scripts/src/commands/rules';

describe('RulesCommand schema', () => {
    it('allows the command to run without a rule', () => {
        expect(rulesCommand.customCommand.mandatoryParameters).toBeUndefined();
        expect(rulesCommand.customCommand.optionalParameters).toEqual([
            { name: 'canopy:rulesRule', type: CustomCommandParamType.Enum },
            { name: 'value', type: CustomCommandParamType.String }
        ]);
    });

    it('appends menu to the settable rule identifiers', () => {
        vi.spyOn(Rules, 'getSettableRuleIDs').mockReturnValue(['foo', 'bar']);
        expect(RulesCommand.getRuleEnumValues()).toEqual(['foo', 'bar', 'menu']);
    });
});

describe('RulesCommand.parseValue', () => {
    it('parses booleans', () => {
        expect(RulesCommand.parseValue('true', 'boolean')).toBe(true);
        expect(RulesCommand.parseValue('false', 'boolean')).toBe(false);
    });

    it('rejects invalid booleans', () => {
        expect(RulesCommand.parseValue('yes', 'boolean')).toBeNaN();
    });

    it('parses integers and floats', () => {
        expect(RulesCommand.parseValue('64', 'integer')).toBe(64);
        expect(RulesCommand.parseValue('1.5', 'float')).toBe(1.5);
    });

    it('rejects invalid numeric values', () => {
        expect(RulesCommand.parseValue('abc', 'integer')).toBeNaN();
        expect(RulesCommand.parseValue('abc', 'float')).toBeNaN();
    });

    it('returns null when no value is supplied', () => {
        expect(RulesCommand.parseValue(null, 'boolean')).toBeNull();
    });
});

describe('rulesCommand dispatch', () => {
    let player;
    let playerOrigin;

    beforeEach(() => {
        vi.restoreAllMocks();
        player = new Player();
        player.name = 'TestPlayer';
        player.commandPermissionLevel = CommandPermissionLevel.GameDirectors;
        playerOrigin = new PlayerCommandOrigin({ sourceEntity: player });
    });

    it('allows an Any player to list rules', () => {
        player.commandPermissionLevel = CommandPermissionLevel.Any;
        expect(rulesCommand.rulesCommand(playerOrigin)).toEqual({ status: 'Success' });
    });

    it('allows an Any player to query a rule', () => {
        player.commandPermissionLevel = CommandPermissionLevel.Any;
        expect(rulesCommand.rulesCommand(playerOrigin, 'exampleRule')).toEqual({ status: 'Success' });
    });

    it('rejects rule changes from an Any player', () => {
        player.commandPermissionLevel = CommandPermissionLevel.Any;
        expect(rulesCommand.rulesCommand(playerOrigin, 'exampleRule', 'true')).toEqual({
            status: 'Failure',
            message: 'commands.generic.nopermission'
        });
    });

    it('rejects menu from an Any player', () => {
        player.commandPermissionLevel = CommandPermissionLevel.Any;
        expect(rulesCommand.rulesCommand(playerOrigin, 'menu')).toEqual({
            status: 'Failure',
            message: 'commands.generic.nopermission'
        });
    });

    it('allows a GameDirector to change a rule', () => {
        expect(rulesCommand.rulesCommand(playerOrigin, 'exampleRule', 'true')).toEqual({
            status: 'Success'
        });
    });

    it('allows a GameDirector to open the menu', () => {
        expect(rulesCommand.rulesCommand(playerOrigin, 'menu')).toEqual({
            status: 'Success'
        });
    });

    it('rejects menu from a non-player origin', () => {
        const serverOrigin = new ServerCommandOrigin({});
        expect(rulesCommand.rulesCommand(serverOrigin, 'menu')).toEqual({
            status: 'Failure',
            message: 'commands.generic.invalidsource'
        });
    });
});

describe('rulesCommand query output', () => {
    let player;
    let origin;

    beforeEach(() => {
        vi.restoreAllMocks();
        player = new Player();
        player.name = 'TestPlayer';
        origin = new PlayerCommandOrigin({ sourceEntity: player });
    });

    it('reports one rule with its current value and description', async () => {
        const rule = {
            getID: () => 'exampleRule',
            getType: () => 'boolean',
            getValue: () => true,
            getDescription: () => ({ text: 'Example description.' })
        };

        await rulesCommand.handleRuleChange(origin, rule, null);

        expect(player.sendMessage).toHaveBeenCalledWith({
            rawtext: [
                { text: '§7exampleRule: §atrue§r§8 - ' },
                { text: 'Example description.' }
            ]
        });
    });

    it('prints all rules with values and descriptions', async () => {
        const rules = [
            {
                getID: () => 'alpha',
                getType: () => 'boolean',
                getValue: () => false,
                getDescription: () => ({ text: 'Alpha rule.' })
            },
            {
                getID: () => 'beta',
                getType: () => 'integer',
                getValue: () => 16,
                getDescription: () => ({ text: 'Beta rule.' })
            }
        ];

        vi.spyOn(rulesCommand, 'getRulesInAlphabeticalOrder').mockReturnValue(rules);
        await rulesCommand.printRules(origin);

        expect(player.sendMessage).toHaveBeenCalledWith({
            rawtext: [
                { translate: 'commands.help.page.header', with: ['Rules'] },
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
                                { text: '§7beta: §u16§8 - ' },
                                { text: 'Beta rule.' }
                            ]
                        }
                    ]
                }
            ]
        });
    });
});
