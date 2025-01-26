import { describe, it, expect, vi, beforeEach } from 'vitest';
import Rule from '../../../../../Canopy [BP]/scripts/lib/canopy/Rule.js';
import Rules from '../../../../../Canopy [BP]/scripts/lib/canopy/Rules.js';

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
    let testRule;
    beforeEach(() => {
        Rules.clear();
        testRule = new Rule({ 
            category: 'test', 
            identifier: 'test_rule',
            description: 'This is a test rule',
            extensionName: 'Test Extension',
            contingentRules: ['test_rule_2'],
            independentRules: ['test_rule_3']
        });
        Rules.add(testRule);
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
            expect(rule.getExtensionName()).toBe(ruleData.extensionName);
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
            expect(rule.getExtensionName()).toBe(false);
        });
    });

    describe('getCategory()', () => {
        it('should return the category', () => {
            expect(Rules.get('test_rule').getCategory()).toBe('test');
        });
    });

    describe('getID()', () => {
        it('should return the identifier', () => {
            expect(Rules.get('test_rule').getID()).toBe('test_rule');
        });
    });

    describe('getDescription()', () => {
        it('should return the description', () => {
            expect(Rules.get('test_rule').getDescription()).toEqual({ text: 'This is a test rule' });
        });
    });

    describe('getContigentRuleIDs()', () => {
        it('should return the contingent rule IDs', () => {
            expect(Rules.get('test_rule').getContigentRuleIDs()).toEqual(['test_rule_2']);
        });
    });

    describe('getIndependentRuleIDs()', () => {
        it('should return the independent rule IDs', () => {
            expect(Rules.get('test_rule').getIndependentRuleIDs()).toEqual(['test_rule_3']);
        });
    });

    describe('getExtensionName()', () => {
        it('should return the extension name', () => {
            expect(Rules.get('test_rule').getExtensionName()).toBe('Test Extension');
        });
    });

    describe.skip('getValue()', () => {
        // Gametest
    });

    describe.skip('getNativeValue()', () => {
        // Gametest
    });

    describe('parseValue()', () => {
        it('should parse JSON strings to objects', () => {
            expect(Rules.get('test_rule').parseValue('{"test": "value"}')).toEqual({ test: 'value' });
            expect(Rules.get('test_rule').parseValue('["test", "value"]')).toEqual(['test', 'value']);
            expect(Rules.get('test_rule').parseValue('true')).toBe(true);
            expect(Rules.get('test_rule').parseValue('null')).toBe(null);
            expect(Rules.get('test_rule').parseValue('1')).toBe(1);
            expect(Rules.get('test_rule').parseValue('"test"')).toBe('test');
            expect(Rules.get('test_rule').parseValue(1)).toBe(1);
        });
    
        it('should return undefined if the value is \'undefined\'', () => {
            expect(Rules.get('test_rule').parseValue('undefined')).toBe(undefined);
        });
    
        it('should return NaN if the value is \'NaN\'', () => {
            expect(Rules.get('test_rule').parseValue('NaN')).toBe(NaN);
        });
    
        it('should return null for invalid JSON strings', () => {
            expect(Rules.get('test_rule').parseValue('invalid')).toBe(null);
        });
    });

    describe.skip('setValue()', () => {
        // Gametest
    });
});