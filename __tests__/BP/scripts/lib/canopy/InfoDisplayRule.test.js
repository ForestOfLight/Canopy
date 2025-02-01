import { describe, it, expect, vi, beforeEach } from 'vitest';
import Rules from '../../../../../Canopy [BP]/scripts/lib/canopy/Rules.js';
import InfoDisplayRule from '../../../../../Canopy [BP]/scripts/lib/canopy/InfoDisplayRule.js';

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

describe('InfoDisplayRule', () => {
    let rule;
    beforeEach(() => {
        Rules.clear();
        rule = new InfoDisplayRule({ 
            category: 'test', 
            identifier: 'test_rule',
            description: 'This is a test rule',
            contingentRules: ['test_rule_2'],
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
            expect(rule.getExtensionName()).toBe(ruleData.extensionName);
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
            rule.setValue(player, 'test_value');
            expect(player.setDynamicProperty).toHaveBeenCalledWith('test_rule', 'test_value');
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