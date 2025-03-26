import { describe, it, expect, vi } from 'vitest';
import { ArgumentParser } from '../../../../../Canopy [BP]/scripts/lib/canopy/ArgumentParser.js';

vi.mock("@minecraft/server", () => ({
    world: { 
        beforeEvents: {
            chatSend: {
                subscribe: vi.fn()
            }
        },
        afterEvents: {
            worldLoad: {
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
        runJob: vi.fn()
    }
}));

describe('ArgumentParser', () => {
    describe('parseCommandString', () => {
        it('should throw an error for an empty command string', () => {
            expect(() => ArgumentParser.parseCommandString('')).toThrow('Invalid command string');
        });


        it('should parse a command string with a boolean argument', () => {
            const commandString = 'command true';
            const result = ArgumentParser.parseCommandString(commandString);
            expect(result).toEqual({
                name: 'command',
                args: [true]
            });
        });
        
        it('should parse a command string with a number argument', () => {
            const commandString = 'command 42';
            const result = ArgumentParser.parseCommandString(commandString);
            expect(result).toEqual({
                name: 'command',
                args: [42]
            });
        });

        it('should parse a command string with a string argument', () => {
            const commandString = 'command test';
            const result = ArgumentParser.parseCommandString(commandString);
            expect(result).toEqual({
                name: 'command',
                args: ['test']
            });
        });

        it('should parse a command string with a quoted string argument', () => {
            const commandString = 'command "test string"';
            const result = ArgumentParser.parseCommandString(commandString);
            expect(result).toEqual({
                name: 'command',
                args: ['test string']
            });
        });

        it('should parse a command string with an array argument', () => {
            const commandString = 'command [1,2,3]';
            const result = ArgumentParser.parseCommandString(commandString);
            expect(result).toEqual({
                name: 'command',
                args: [[1, 2, 3]]
            });
        });

        it('should parse a command string with an entity argument', () => {
            const commandString = 'command @e[type=creeper]';
            const result = ArgumentParser.parseCommandString(commandString);
            expect(result).toEqual({
                name: 'command',
                args: ['@e[type=creeper]']
            });
        });

        it('should return an empty array if no arguments are provided', () => {
            const commandString = 'command';
            const result = ArgumentParser.parseCommandString(commandString);
            expect(result).toEqual({
                name: 'command',
                args: []
            });
        });

        it('should handle mixed argument types', () => {
            const commandString = 'command true 42 "test string" [1,2,3] @e[type=creeper]';
            const result = ArgumentParser.parseCommandString(commandString);
            expect(result).toEqual({
                name: 'command',
                args: [true, 42, 'test string', [1, 2, 3], '@e[type=creeper]']
            });
        });

        it('should be able to parse args back to their command string', () => {
            const commandString = 'command true 42 "test string" [1,2,3] "@e[type=creeper]"';
            const result = ArgumentParser.parseCommandString(commandString);
            const parsedArgs = result.args.map(arg => {
                if (typeof arg === 'string')
                    return `"${arg}"`;
                else if (Array.isArray(arg))
                    return `[${arg.join(',')}]`;
                return arg;
            });
            expect(parsedArgs.join(' ')).toEqual(`true 42 "test string" [1,2,3] "@e[type=creeper]"`);
        });
    });
});