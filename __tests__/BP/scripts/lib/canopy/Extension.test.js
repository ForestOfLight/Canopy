import { describe, it, expect, vi } from 'vitest';
import Extension from '../../../../../Canopy [BP]/scripts/lib/canopy/Extension.js';
import Command from '../../../../../Canopy [BP]/scripts/lib/canopy/Command.js';
import Rule from '../../../../../Canopy [BP]/scripts/lib/canopy/Rule.js';

vi.mock('@minecraft/server', () => ({
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
        runJob: vi.fn()
    }
}));

describe('Extension', () => {
    const extensionData = {
        name: 'Test Extension',
        version: '1.0.0',
        author: 'Author Name',
        description: 'This is a test extension'
    };
    const extension = new Extension(extensionData);

    describe('constructor', () => {
        it('should initialize with correct properties', () => {
            expect(extension.getID()).toBe('test_extension');
            expect(extension.getName()).toBe('Test Extension');
            expect(extension.getVersion()).toBe('1.0.0');
            expect(extension.getAuthors()).toBe('Author Name');
            expect(extension.getDescription()).toEqual({ text: 'This is a test extension' });
            expect(extension.getCommands()).toEqual([]);
            expect(extension.getRules()).toEqual([]);
        });

        it('should handle description as an object', () => {
            const extensionData = {
                name: 'Test Extension',
                version: '1.0.0',
                author: 'Author Name',
                description: { text: 'This is a test extension' }
            };
            const extension = new Extension(extensionData);
            expect(extension.getDescription()).toEqual({ text: 'This is a test extension' });
        });
    });

    describe('getID', () => {
        it('should return the ID', () => {
            expect(extension.getID()).toBe('test_extension');
        });
    });

    describe('getName', () => {
        it('should return the name', () => {
            expect(extension.getName()).toBe('Test Extension');
        });
    });

    describe('getVersion', () => {
        it('should return the version', () => {
            expect(extension.getVersion()).toBe('1.0.0');
        });
    });

    describe('getAuthors', () => {
        it('should return the author', () => {
            expect(extension.getAuthors()).toBe('Author Name');
        });
    });

    describe('getDescription', () => {
        it('should return the description as RawText', () => {
            expect(extension.getDescription()).toEqual({ text: 'This is a test extension' });
        });
    });

    describe('getCommands', () => {
        it('should return the commands', () => {
            expect(extension.getCommands()).toEqual([]);
        });
    });

    describe('getRules', () => {
        it('should return the rules', () => {
            expect(extension.getRules()).toEqual([]);
        });
    });

    describe('getCommand', () => {
        it('should return the command by name', () => {
            const cmd = new Command({ 
                name: 'test_command', 
                description: 'Test Command',
                usage: 'test_command <arg1> [arg2]',
                args: [
                    { name: 'arg1', type: 'string' },
                    { name: 'arg2', type: 'string', optional: true }
                ],
                callback: vi.fn()
            });
            extension.commands.push(cmd);
            expect(extension.getCommand('test_command')).toBe(cmd);
            extension.commands = [];
        });
    });

    describe('getRule', () => {
        it('should return the rule by name', () => {
            const rule = new Rule({ 
                category: 'test', 
                identifier: 'test_rule',
                description: 'Test Rule'
            });
            extension.rules.push(rule);
            expect(extension.getRule('test_rule')).toBe(rule);
        });
    });

    describe.skip('setupCommandRegistration', () => {
        // Gametest
    });

    describe.skip('setupRuleRegistration', () => {
        // Gametest
    });

    describe('makeID()', () => {
        console.warn = vi.fn();
        it('should return a valid ID', () => {
            expect(extension.makeID('TestExtension')).toBe('testextension');
        });

        it('should handle special characters', () => {
            expect(extension.makeID('Test Extension!')).toBe('test_extension');
        });

        it('should handle spaces', () => {
            expect(extension.makeID('Test Extension 2')).toBe('test_extension_2');
        });

        it('should handle numbers', () => {
            expect(extension.makeID('Test Extension 3')).toBe('test_extension_3');
        });

        it('should handle mixed characters', () => {
            expect(extension.makeID('Test E%t3nsion 4!')).toBe('test_et3nsion_4');
        });

        it('should handle empty string', () => {
            expect(extension.makeID('')).toBe(null);
        });

        it('should throw error for non strings', () => {
            expect(extension.makeID(123)).toBeNull();
            expect(extension.makeID([])).toBeNull();
            expect(extension.makeID({})).toBeNull();
            expect(extension.makeID(null)).toBeNull();
            expect(extension.makeID(undefined)).toBeNull();
        });     
    });
});