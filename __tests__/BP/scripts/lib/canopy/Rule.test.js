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
    beforeEach(() => {
        Rules.clear();
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
        console.warn = vi.fn();
        it('should add the rule to the Rules registry', () => {
            expect(Rules.exists('test_rule')).toBe(true);
        });

        it('should warn if a rule with the same identifier already exists', () => {
            new Rule({ category: 'test', identifier: 'test_rule' });
            expect(console.warn).toHaveBeenCalled();
        });

        it('should not add the rule to the Rules registry if a rule with the same identifier already exists', () => {
            new Rule({ category: 'test', identifier: 'test_rule' });
            expect(Rules.getAll().length).toBe(1);
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

    describe('getDependentRuleIDs()', () => {
        beforeEach(() => {
            new Rule({ 
                category: 'test', 
                identifier: 'test_rule_2',
                description: 'This is another test rule',
                extensionName: 'Test Extension',
                contingentRules: [],
                independentRules: []
            });
        });
        
        it('should return an array of rule IDs that are dependent on the rule', () => {
            expect(Rules.get('test_rule_2').getDependentRuleIDs()).toEqual(['test_rule']);
        });
        
        it('should return an empty array if no rules are dependent on the rule', () => {
            expect(Rules.get('test_rule').getDependentRuleIDs()).toEqual([]);
        });
    });
});