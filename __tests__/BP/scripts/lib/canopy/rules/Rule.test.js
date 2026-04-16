import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Rule } from '../../../../../../Canopy [BP]/scripts/lib/canopy/rules/Rule.js';
import { BooleanRule } from '../../../../../../Canopy [BP]/scripts/lib/canopy/rules/BooleanRule.js';
import { IntegerRule } from '../../../../../../Canopy [BP]/scripts/lib/canopy/rules/IntegerRule.js';
import { Rules } from '../../../../../../Canopy [BP]/scripts/lib/canopy/rules/Rules.js';

class ConcreteRule extends Rule {}

describe('Rule', () => {
    beforeEach(() => {
        Rules.clear();
    });

    describe('constructor', () => {
        it('should throw when instantiated directly', () => {
            expect(() => new Rule({ category: 'test', identifier: 'test_rule' }))
                .toThrow("Abstract class 'Rule' cannot be instantiated directly.");
        });
    });

    describe('getType', () => {
        it('should throw when not overridden', () => {
            const rule = new ConcreteRule({ category: 'test', identifier: 'concrete_rule' });
            expect(() => rule.getType()).toThrow('[Canopy] getType() must be implemented.');
        });
    });

    describe('isInDomain', () => {
        it('should throw when not overridden', () => {
            const rule = new ConcreteRule({ category: 'test', identifier: 'concrete_rule' });
            expect(() => rule.isInDomain(true)).toThrow('[Canopy] isInDomain() must be implemented.');
        });
    });

    describe('isInRange', () => {
        it('should throw when not overridden', () => {
            const rule = new ConcreteRule({ category: 'test', identifier: 'concrete_rule' });
            expect(() => rule.isInRange(true)).toThrow('[Canopy] isInRange() must be implemented.');
        });
    });

    describe('setValue', () => {
        it('should throw when the value is not in the domain', () => {
            const rule = new BooleanRule({ category: 'test', identifier: 'domain_check_rule' });
            expect(() => rule.setValue('not_a_boolean')).toThrow('[Canopy] Incorrect value type for rule');
        });

        it('should throw when the value is in domain but out of range', () => {
            const rule = new IntegerRule({
                category: 'test',
                identifier: 'range_check_rule',
                valueRange: { range: { min: 0, max: 10 } }
            });
            expect(() => rule.setValue(100)).toThrow('[Canopy] Value out of range for rule');
        });

        it('should use a no-op default for onModifyCallback', () => {
            const rule = new IntegerRule({
                category: 'test',
                identifier: 'default_modify_rule',
                valueRange: { range: { min: 0, max: 10 } }
            });
            expect(() => rule.setValue(5)).not.toThrow();
        });
    });

    describe('getValue', () => {
        it('should return NaN when the stored value is the string "NaN"', async () => {
            const { world } = await import('@minecraft/server');
            world.getDynamicProperty.mockReturnValue('NaN');
            const rule = new BooleanRule({ category: 'test', identifier: 'nan_rule' });
            const value = await rule.getValue();
            expect(value).toBeNaN();
        });

        it('should throw when the stored value is unparseable non-NaN', async () => {
            const { world } = await import('@minecraft/server');
            world.getDynamicProperty.mockReturnValue('not-valid-json{');
            const rule = new BooleanRule({ category: 'test', identifier: 'bad_json_rule' });
            await expect(rule.getValue()).rejects.toThrow('Failed to parse value for DynamicProperty');
        });
    });
});
