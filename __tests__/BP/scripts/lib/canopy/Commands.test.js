import { describe, it, expect, vi, beforeEach } from "vitest";
import { Commands } from "../../../../../Canopy [BP]/scripts/lib/canopy/Commands";
import { Rule } from "../../../../../Canopy [BP]/scripts/lib/canopy/Rule";
import { Rules } from "../../../../../Canopy [BP]/scripts/lib/canopy/Rules";

vi.mock("@minecraft/server", () => ({
    world: { 
        beforeEvents: {
            chatSend: {
                subscribe: vi.fn()
            }
        }
    },
    system: {
        afterEvents: {
            scriptEventReceive: {
                subscribe: vi.fn()
            }
        },
        runJob: vi.fn(),
        run: (callback) => callback()
    }
}));

describe('Commands', () => {
    beforeEach(() => {
        Commands.clear();
    });

    describe('register', () => {
        it('should register the command', () => {
            const command = { name: 'test', getName: () => 'test' };
            Commands.register(command);
            expect(Commands.get('test')).toBe(command);
        });

        it('should throw an error if the command already exists', () => {
            const command = { name: 'test', getName: () => 'test' };
            Commands.register(command);
            expect(() => Commands.register(command)).toThrow('[Canopy] Command with name \'test\' already exists.');
        });
    });

    describe('get', () => {
        it('should return the command with the given name', () => {
            const command = { name: 'test', getName: () => 'test' };
            Commands.register(command);
            expect(Commands.get('test')).toBe(command);
        });

        it('should return undefined if the command does not exist', () => {
            expect(Commands.get('test')).toBeUndefined();
        });
    });

    describe('getAll', () => {
        it('should return all registered commands', () => {
            const command1 = { name: 'test1', getName: () => 'test1' };
            const command2 = { name: 'test2', getName: () => 'test2' };
            Commands.register(command1);
            Commands.register(command2);
            expect(Commands.getAll()).toEqual([command1, command2]);
        });
    });

    describe('exists', () => {
        it('should return true if the command exists', () => {
            const command = { name: 'test', getName: () => 'test' };
            Commands.register(command);
            expect(Commands.exists('test')).toBe(true);
        });

        it('should return false if the command does not exist', () => {
            expect(Commands.exists('test')).toBe(false);
        });
    });

    describe('remove', () => {
        it('should remove the command with the given name', () => {
            const command = { name: 'test', getName: () => 'test' };
            Commands.register(command);
            Commands.remove('test');
            expect(Commands.exists('test')).toBe(false);
        });
    });

    describe('clear', () => {
        it('should remove all commands', () => {
            const command1 = { name: 'test1', getName: () => 'test1' };
            const command2 = { name: 'test2', getName: () => 'test2' };
            Commands.register(command1);
            Commands.register(command2);
            Commands.clear();
            expect(Commands.getAll()).toEqual([]);
        });
    });

    describe('getPrefix', () => {
        it('should return the command prefix', () => {
            expect(Commands.getPrefix()).toBe('./');
        });
    });

    describe('getNativeCommands', () => {
        it('should return all commands without an extension name', () => {
            const command1 = { name: 'test1', getName: () => 'test1', getExtension: () => undefined };
            const command2 = { name: 'test2', getName: () => 'test2', getExtension: () => 'extension' };
            Commands.register(command1);
            Commands.register(command2);
            expect(Commands.getNativeCommands()).toEqual([command1]);
        });

        it('should sort the commands alphabetically', () => {
            const command1 = { name: 'b', getName: () => 'b', getExtension: () => undefined };
            const command2 = { name: 'a', getName: () => 'a',  getExtension: () => undefined };
            Commands.register(command1);
            Commands.register(command2);
            expect(Commands.getNativeCommands()).toEqual([command2, command1]);
        });
    });

    describe('executeCommand', () => {
        let command;
        let sender;
        let rule1;

        beforeEach(() => {
            Commands.clear();
            Rules.clear();
            command = { name: 'test', 
                getName: () => 'test', 
                isAdminOnly: () => false, 
                getContingentRules: () => ['rule1'],
                getArgs: () => [
                    { type: 'string', name: 'strArg' },
                    { type: 'boolean', name: 'boolArg' },
                    { type: 'number', name: 'numArg' },
                    { type: 'identifier', name: 'entityArg' },
                    { type: 'array', name: 'arrayArg' },
                    { type: 'player', name: 'playerArg' },
                ],
                runCallback: vi.fn() };
            sender = { sendMessage: vi.fn() };
            rule1 = new Rule({ category: 'test', identifier: 'rule1'});
            rule1.getValue = vi.fn(() => true);
            Commands.register(command);
        });

        it('should send an error message if the command does not exist', () => {
            Commands.executeCommand(sender, 'invalid', []);
            expect(sender.sendMessage).toHaveBeenCalledWith({ translate: 'commands.generic.unknown', with: ['invalid', Commands.getPrefix()] });
        });

        it('should send an error message if the command is admin only and the sender is not an admin', () => {
            command.isAdminOnly = () => true;
            sender.hasTag = () => false;
            Commands.executeCommand(sender, 'test', []);
            expect(sender.sendMessage).toHaveBeenCalledWith({ translate: 'commands.generic.nopermission' });
        });

        it('should send a blocked message for each disabled contingent rule', async () => {
            command.getContingentRules = () => ['rule1', 'rule2'];
            const rule2 = new Rule({ category: 'test', identifier: 'rule2'});
            rule1.getValue = vi.fn(() => false);
            rule2.getValue = vi.fn(() => false);
            await Commands.executeCommand(sender, 'test', []);
            expect(sender.sendMessage).toHaveBeenCalledTimes(2);
            expect(sender.sendMessage).toHaveBeenCalledWith({ translate: 'rules.generic.blocked', with: ['rule1'] });
            expect(sender.sendMessage).toHaveBeenCalledWith({ translate: 'rules.generic.blocked', with: ['rule2'] });
        });

        it('should not run the command if there are disabled contingent rules', async () => {
            command.getContingentRules = () => ['rule1'];
            rule1.getValue = vi.fn(() => false);
            await Commands.executeCommand(sender, 'test', []);
            expect(command.runCallback).not.toHaveBeenCalled();
        });

        it('should run the command if there are no disabled contingent rules', async () => {
            await Commands.executeCommand(sender, 'test', []);
            expect(command.runCallback).toHaveBeenCalled();
        });

        it('should interpret the arguments', async () => {
            await Commands.executeCommand(sender, 'test', ['str', true, 1, '@e', [1,2,3], '@player']);
            expect(command.runCallback).toHaveBeenCalledWith(sender, { strArg: 'str', boolArg: true, numArg: 1, entityArg: '@e', arrayArg: [1, 2, 3], playerArg: '@player' });
        });

        it('should interpret the arguments as null if they are invalid', async () => {
            await Commands.executeCommand(sender, 'test', [undefined, undefined, undefined, undefined, undefined, undefined]);
            expect(command.runCallback).toHaveBeenCalledWith(sender, { strArg: null, boolArg: null, numArg: null, entityArg: null, arrayArg: null, playerArg: null });
        });

        it('should interpret the arguments as null if they are missing', async () => {
            await Commands.executeCommand(sender, 'test', []);
            expect(command.runCallback).toHaveBeenCalledWith(sender, { strArg: null, boolArg: null, numArg: null, entityArg: null, arrayArg: null, playerArg: null });
        });

        it('should interpret any multiarguments', async () => {
            const command2 = { name: 'test2', 
                getName: () => 'test2', 
                isAdminOnly: () => false, 
                getContingentRules: () => ['rule1'],
                getArgs: () => [
                    { type: 'string|boolean|number|identifier|array|player', name: 'multiArg' },
                ],
                runCallback: vi.fn() };
            Commands.register(command2);
            await Commands.executeCommand(sender, 'test2', ['str']);
            await Commands.executeCommand(sender, 'test2', [true]);
            await Commands.executeCommand(sender, 'test2', [1]);
            await Commands.executeCommand(sender, 'test2', ['@e']);
            await Commands.executeCommand(sender, 'test2', ['@e[type=creeper]']);
            await Commands.executeCommand(sender, 'test2', [[1,2,3]]);
            await Commands.executeCommand(sender, 'test2', ['@player']);
            await Commands.executeCommand(sender, 'test2', ['"@player name"']);
            expect(command2.runCallback).toHaveBeenCalledTimes(8);
        });

        it('should interpret the identifier argument with brackets', async () => {
            const command2 = { name: 'test2', 
                getName: () => 'test2', 
                isAdminOnly: () => false, 
                getContingentRules: () => ['rule1'],
                getArgs: () => [
                    { type: 'string|boolean|number|identifier', name: 'multiArg' },
                ],
                runCallback: vi.fn() };
            Commands.register(command2);
            await Commands.executeCommand(sender, 'test2', ['@e[type=creeper]']);
            expect(command2.runCallback).toHaveBeenCalledWith(sender, { multiArg: '@e[type=creeper]' });
        });

        it('should interpret the identifier argument without brackets', async () => {
            const command2 = { name: 'test2', 
                getName: () => 'test2', 
                isAdminOnly: () => false, 
                getContingentRules: () => ['rule1'],
                getArgs: () => [
                    { type: 'string|boolean|number|identifier', name: 'multiArg' },
                ],
                runCallback: vi.fn() };
            Commands.register(command2);
            await Commands.executeCommand(sender, 'test2', ['@player']);
            expect(command2.runCallback).toHaveBeenCalledWith(sender, { multiArg: '@player' });
        });

        it('should interpret the player argument with spaces', async () => {
            const command2 = { name: 'test2', 
                getName: () => 'test2', 
                isAdminOnly: () => false, 
                getContingentRules: () => ['rule1'],
                getArgs: () => [
                    { type: 'string|boolean|number|identifier', name: 'multiArg' },
                ],
                runCallback: vi.fn() };
            Commands.register(command2);
            await Commands.executeCommand(sender, 'test2', ['"@player name"']);
            expect(command2.runCallback).toHaveBeenCalledWith(sender, { multiArg: '"@player name"' });
        });

        it('should interpret the player argument without spaces', async () => {
            const command2 = { name: 'test2', 
                getName: () => 'test2', 
                isAdminOnly: () => false, 
                getContingentRules: () => ['rule1'],
                getArgs: () => [
                    { type: 'string|boolean|number|identifier', name: 'multiArg' },
                ],
                runCallback: vi.fn() };
            Commands.register(command2);
            await Commands.executeCommand(sender, 'test2', ['@player']);
            expect(command2.runCallback).toHaveBeenCalledWith(sender, { multiArg: '@player' });
        });
    });
});