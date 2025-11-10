import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Rules } from '../../../../../Canopy [BP]/scripts/lib/canopy/rules/Rules.js';
import { InfoDisplayRule } from '../../../../../Canopy [BP]/scripts/lib/canopy/rules/InfoDisplayRule.js';
import { BooleanRule } from '../../../../../Canopy [BP]/scripts/lib/canopy/rules/BooleanRule.js';

vi.mock('@minecraft/server', () => ({
    world: { 
        beforeEvents: {
            chatSend: {
                subscribe: vi.fn()
            }
        },
        afterEvents: {
            worldLoad: {
                subscribe: (callback) => {
                    callback();
                }
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

describe('InfoDisplayRule', () => {
    let rule;
    beforeEach(() => {
        Rules.clear();
        rule = new InfoDisplayRule({ 
            category: 'test', 
            identifier: 'test_rule',
            description: 'This is a test rule',
            contingentRules: ['test_rule_2']
        });
    });

    describe('constructor', () => {
        it('should initialize with the correct properties', () => {
            const ruleData = {
                category: 'test',
                identifier: 'test_rule',
                description: 'This is a test rule',
                contingentRules: ['test_rule_2'],
                independentRules: [],
                extensionName: false
            };

            expect(rule.getCategory()).toBe("InfoDisplay");
            expect(rule.getID()).toBe(ruleData.identifier);
            expect(rule.getDescription()).toEqual({ text: ruleData.description });
            expect(rule.getContigentRuleIDs()).toEqual(ruleData.contingentRules);
            expect(rule.getIndependentRuleIDs()).toEqual(ruleData.independentRules);
            expect(rule.getExtension()).toBe(ruleData.extension);
        });

        it('should set description to a rawtext object if it is a string', () => {
            expect(rule.getDescription()).toEqual({ text: 'This is a test rule' });
        });
    });

    describe('getValue', () => {
        it('should get the dynamic property from the player', () => {
            const player = { getDynamicProperty: vi.fn() };
            rule.getValue(player);
            expect(player.getDynamicProperty).toHaveBeenCalledWith('test_rule');
        });
    });

    describe('setValue', () => {
        it('should set the dynamic property on the player', () => {
            const player = { setDynamicProperty: vi.fn() };
            rule.setValue(player, true);
            expect(player.setDynamicProperty).toHaveBeenCalledWith('test_rule', true);
        });
    });

    describe('get', () => {
        it('should return the rule if it exists as an InfoDisplay rule', () => {
            const fetchedRule = InfoDisplayRule.get('test_rule');
            expect(fetchedRule).toBe(rule);
        });

        it('should return undefined if the rule does not exist', () => {
            const fetchedRule = InfoDisplayRule.get('non_existent_rule');
            expect(fetchedRule).toBeUndefined();
        });

        it('should return undefined if the rule exists but is not an InfoDisplay rule', () => {
            new BooleanRule({ 
                category: 'test', 
                identifier: 'non_info_display_rule',
                description: 'This is a test rule',
                contingentRules: ['test_rule_2']
            });
            const fetchedRule = InfoDisplayRule.get('non_info_display_rule');
            expect(fetchedRule).toBeUndefined();
        });
    });

    describe('getValue', () => {
        it('should get the value from the InfoDisplayRule', () => {
            const player = { getDynamicProperty: vi.fn(() => 'test_value') };
            expect(InfoDisplayRule.getValue(player, 'test_rule')).toBe('test_value');
        });
    });

    describe('setValue', () => {
        it('should set the value on the InfoDisplayRule', () => {
            const player = { setDynamicProperty: vi.fn() };
            InfoDisplayRule.setValue(player, 'test_rule', true);
            expect(player.setDynamicProperty).toHaveBeenCalledWith('test_rule', true);
        });
    });

    describe('exists', () => {
        it('should return true if the rule exists and is an InfoDisplay rule', () => {
            expect(InfoDisplayRule.exists('test_rule')).toBe(true);
        });

        it('should return false if the rule does not exist', () => {
            expect(InfoDisplayRule.exists('non_existent_rule')).toBe(false);
        });

        it('should return false if the rule exists but is not an InfoDisplay rule', () => {
            new BooleanRule({ 
                category: 'test', 
                identifier: 'non_info_display_rule',
                description: 'This is a test rule',
                contingentRules: ['test_rule_2']
            });
            expect(InfoDisplayRule.exists('non_info_display_rule')).toBe(false);
        });
    });

    describe('getAll', () => {
        it('should return all InfoDisplayRule instances', () => {
            const rules = InfoDisplayRule.getAll();
            expect(rules.length).toBe(1);
            expect(rules[0].getID()).toBe('test_rule');
        });
    });
});