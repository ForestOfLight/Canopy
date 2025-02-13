import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Rule } from '../../../../../Canopy [BP]/scripts/lib/canopy/Rule.js';
import { Rules } from '../../../../../Canopy [BP]/scripts/lib/canopy/Rules.js';
import IPC from '../../../../../Canopy [BP]/scripts/lib/ipc/ipc.js';
import { Extensions } from '../../../../../Canopy [BP]/scripts/lib/canopy/Extensions.js';
import { Extension } from '../../../../../Canopy [BP]/scripts/lib/canopy/Extension.js';

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

describe('Rule', () => {
    beforeEach(() => {
        Rules.clear();
        Extensions.extensions['Test Extension'] = new Extension({
            name: 'Test Extension',
            version: '1.0.0',
            author: 'Author Name',
            description: 'This is a test extension'
        });
        new Rule({ 
            category: 'test', 
            identifier: 'test_rule',
            description: 'This is a test rule',
            extensionName: 'Test Extension',
            contingentRules: ['test_rule_2'],
            independentRules: ['test_rule_3']
        });
    });

    describe('constructor', () => {
        it('should initialize with the correct properties', () => {
            const ruleData = {
                category: 'test_category',
                identifier: 'test_identifier',
                description: 'test_description',
                contingentRules: ['rule1', 'rule2'],
                independentRules: ['rule3', 'rule4'],
                extensionName: 'test_extension'
            };
            const rule = new Rule(ruleData);

            expect(rule.getCategory()).toBe(ruleData.category);
            expect(rule.getID()).toBe(ruleData.identifier);
            expect(rule.getDescription()).toEqual({ text: ruleData.description });
            expect(rule.getContigentRuleIDs()).toEqual(ruleData.contingentRules);
            expect(rule.getIndependentRuleIDs()).toEqual(ruleData.independentRules);
            expect(rule.getExtension()).toBe(ruleData.extension);
        });

        it('should set description to a rawtext object if it is a string', () => {
            const rule = new Rule({
                category: 'test_category',
                identifier: 'test_identifier',
                description: 'test_description'
            });

            expect(rule.getDescription()).toEqual({ text: 'test_description' });
        });

        it('should set default values for optional properties', () => {
            const rule = new Rule({
                category: 'test_category',
                identifier: 'test_identifier'
            });

            expect(rule.getDescription()).toEqual({ text: '' });
            expect(rule.getContigentRuleIDs()).toEqual([]);
            expect(rule.getIndependentRuleIDs()).toEqual([]);
            expect(rule.getExtension()).toBe(undefined);
        });
    });

    describe('getCategory', () => {
        it('should return the category', () => {
            expect(Rules.get('test_rule').getCategory()).toBe('test');
        });
    });

    describe('getID', () => {
        it('should return the identifier', () => {
            expect(Rules.get('test_rule').getID()).toBe('test_rule');
        });
    });

    describe('getDescription', () => {
        it('should return the description', () => {
            expect(Rules.get('test_rule').getDescription()).toEqual({ text: 'This is a test rule' });
        });
    });

    describe('getContigentRuleIDs', () => {
        it('should return the contingent rule IDs', () => {
            expect(Rules.get('test_rule').getContigentRuleIDs()).toEqual(['test_rule_2']);
        });
    });

    describe('getIndependentRuleIDs', () => {
        it('should return the independent rule IDs', () => {
            expect(Rules.get('test_rule').getIndependentRuleIDs()).toEqual(['test_rule_3']);
        });
    });

    describe('getExtension', () => {
        it('should return the extension', () => {
            expect(Rules.get('test_rule').getExtension()).toBe(Extensions.extensions['Test Extension']);
        });
    });

    describe('getValue', () => {
        it('should return the value from the extension if it exists', async () => {
            const ipcInvokeMock = vi.spyOn(IPC, "invoke");
            ipcInvokeMock.mockResolvedValue('{"test": "value"}');
            expect(await Rules.get('test_rule').getValue()).toEqual({ test: 'value' });
        });

        it.skip('should return the value from the world if it does not exist in the extension', async () => {
            // Gametest DP
        });
    });

    describe('getNativeValue', () => {
        it.skip('should return the value from the world if it exists', () => {
            // Gametest DP
        });

        it('should throw an error if the rule is from an extension', () => {
            expect(() => Rules.get('test_rule').getNativeValue()).toThrowError();
        });
    });

    describe('setValue', () => {
        it.skip('should set the value in the world', () => {
            // Gametest DP
        });

        it('should should set the value in the extension if it exists', async () => {
            const ipcSendMock = vi.spyOn(IPC, "send");
            ipcSendMock.mockResolvedValue(true);
            await Rules.get('test_rule').setValue(true);
            expect(ipcSendMock).toHaveBeenCalledWith(
                `canopyExtension:${Rules.get('test_rule').getExtension().getID()}:ruleValueSet`,
                { 
                    ruleID: 'test_rule',
                    value: true 
                }
            );
        });
    });

    describe('parseValue', () => {
        it('should parse JSON strings to objects', () => {
            expect(Rules.get('test_rule').parseValue('{"test": "value"}')).toEqual({ test: 'value' });
            expect(Rules.get('test_rule').parseValue('["test", "value"]')).toEqual(['test', 'value']);
            expect(Rules.get('test_rule').parseValue('true')).toBe(true);
            expect(Rules.get('test_rule').parseValue('null')).toBeNull();
            expect(Rules.get('test_rule').parseValue('1')).toBe(1);
            expect(Rules.get('test_rule').parseValue('"test"')).toBe('test');
            expect(Rules.get('test_rule').parseValue(1)).toBe(1);
        });
    
        it('should return undefined if the value is \'undefined\'', () => {
            expect(Rules.get('test_rule').parseValue('undefined')).toBeUndefined();
        });
    
        it('should return NaN if the value is \'NaN\'', () => {
            expect(Rules.get('test_rule').parseValue('NaN')).toBeNaN();
        });
    
        it('should return null for invalid JSON strings', () => {
            const warn = console.warn;
            console.warn = vi.fn();
            expect(Rules.get('test_rule').parseValue('invalid')).toBeNull();
            expect(console.warn).toHaveBeenCalled();
            console.warn = warn;
        });
    });
});