import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BooleanRule } from '../../../../../Canopy [BP]/scripts/lib/canopy/rules/BooleanRule.js';
import { Rules } from '../../../../../Canopy [BP]/scripts/lib/canopy/rules/Rules.js';
import IPC from '../../../../../Canopy [BP]/scripts/lib/MCBE-IPC/ipc.js';
import { Extensions } from '../../../../../Canopy [BP]/scripts/lib/canopy/Extensions.js';
import { Extension } from '../../../../../Canopy [BP]/scripts/lib/canopy/Extension.js';
import { RuleValueSet } from '../../../../../Canopy [BP]/scripts/lib/canopy/extension.ipc.js';

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
        },
        setDynamicProperty: vi.fn(),
        getDynamicProperty: vi.fn(() => false)
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

vi.mock("@minecraft/server-ui", () => ({
    ModalFormData: vi.fn()
}));

describe('BooleanRule', () => {
    beforeEach(() => {
        Rules.clear();
        Extensions.extensions['Test Extension'] = new Extension({
            name: 'Test Extension',
            version: '1.0.0',
            author: 'Author Name',
            description: 'This is a test extension'
        });
        new BooleanRule({ 
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
            const rule = new BooleanRule(ruleData);

            expect(rule.getCategory()).toBe(ruleData.category);
            expect(rule.getID()).toBe(ruleData.identifier);
            expect(rule.getDescription()).toEqual({ text: ruleData.description });
            expect(rule.getContigentRuleIDs()).toEqual(ruleData.contingentRules);
            expect(rule.getIndependentRuleIDs()).toEqual(ruleData.independentRules);
            expect(rule.getExtension()).toBe(ruleData.extension);
        });

        it('should set description to a rawtext object if it is a string', () => {
            const rule = new BooleanRule({
                category: 'test_category',
                identifier: 'test_identifier',
                description: 'test_description'
            });

            expect(rule.getDescription()).toEqual({ text: 'test_description' });
        });

        it('should set default values for optional properties', () => {
            const rule = new BooleanRule({
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

    describe('getDependentRuleIDs', () => {
        it('should return the dependent rule IDs', () => {
            new BooleanRule({
                category: 'test_category',
                identifier: 'test_rule_2',
                description: 'test_description',
                contingentRules: [],
                independentRules: []
            });
            expect(Rules.get('test_rule_2').getDependentRuleIDs()).toEqual(['test_rule']);
        });

        it('should return an empty array if there are no dependent rules', () => {
            const rule = new BooleanRule({
                category: 'test_category',
                identifier: 'test_identifier',
                description: 'test_description',
                contingentRules: [],
                independentRules: []
            });
            expect(rule.getDependentRuleIDs()).toEqual([]);
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
            ipcInvokeMock.mockResolvedValue({ value: {"test": "value"} });
            const value = await Rules.get('test_rule').getValue();
            expect(value).toEqual({ test: 'value' });
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

        it('should call onEnable if the value is true', () => {
            const onEnableCallback = vi.fn();
            const rule = new BooleanRule({
                category: 'test_category',
                identifier: 'test_rule_2',
                description: 'test_description',
                contingentRules: [],
                independentRules: [],
                onEnableCallback: onEnableCallback
            });
            rule.setValue(true);
            expect(onEnableCallback).toHaveBeenCalled();
        });

        it('should call onDisable if the value is false', () => {
            const onDisableCallback = vi.fn();
            const rule = new BooleanRule({
                category: 'test_category',
                identifier: 'test_rule_2',
                description: 'test_description',
                contingentRules: [],
                independentRules: [],
                onDisableCallback: onDisableCallback
            });
            rule.setValue(false);
            expect(onDisableCallback).toHaveBeenCalled();
        });

        it('should should set the value in the extension if it exists', async () => {
            const ipcSendMock = vi.spyOn(IPC, "send");
            ipcSendMock.mockResolvedValue(true);
            await Rules.get('test_rule').setValue(true);
            expect(ipcSendMock).toHaveBeenCalledWith(
                `canopyExtension:${Rules.get('test_rule').getExtension().getID()}:ruleValueSet`,
                RuleValueSet,
                { 
                    ruleID: 'test_rule',
                    value: true 
                }
            );
        });
    });

    describe('onEnable', () => {
        it('should call the onEnable callback of the rule', () => {
            const onEnableCallback = vi.fn();
            const rule = new BooleanRule({
                category: 'test_category',
                identifier: 'test_rule_2',
                description: 'test_description',
                contingentRules: [],
                independentRules: [],
                onEnableCallback: onEnableCallback
            });
            rule.onEnable();
            expect(onEnableCallback).toHaveBeenCalled();
        });
    });

    describe('onDisable', () => {
        it('should call the onDisable function of the rule', () => {
            const onDisableCallback = vi.fn();
            const rule = new BooleanRule({
                category: 'test_category',
                identifier: 'test_rule_2',
                description: 'test_description',
                contingentRules: [],
                independentRules: [],
                onDisableCallback: onDisableCallback
            });
            rule.onDisable();
            expect(onDisableCallback).toHaveBeenCalled();
        });
    });

    describe('onModifyBool', () => {
        it('should throw an error if the value is invalid', () => {
            const rule = new BooleanRule({
                category: 'test_category',
                identifier: 'test_rule_2',
                description: 'test_description',
                contingentRules: [],
                independentRules: []
            });
            expect(() => rule.onModifyBool()).toThrow();
        });
    });

    describe('resetToDefaultValue', () => {
        it('should reset the value to the default', async () => {
            const rule = new BooleanRule({
                category: 'test_category',
                identifier: 'test_rule_2',
                description: 'test_description',
                contingentRules: [],
                independentRules: []
            });
            rule.setValue(true);
            rule.resetToDefaultValue();
            expect(await rule.getValue()).toEqual(false);
        });
    });
});