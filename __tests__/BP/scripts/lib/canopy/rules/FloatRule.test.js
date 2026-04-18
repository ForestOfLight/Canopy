import { describe, it, expect, beforeEach } from 'vitest';
import { FloatRule } from '../../../../../../Canopy [BP]/scripts/lib/canopy/rules/FloatRule.js';
import { Rules } from '../../../../../../Canopy [BP]/scripts/lib/canopy/rules/Rules.js';

describe('FloatRule', () => {
    let rule;

    beforeEach(() => {
        Rules.clear();
        rule = new FloatRule({
            category: 'test',
            identifier: 'test_float_rule',
            description: 'Test float rule',
            valueRange: { range: { min: 0.0, max: 1.0 } }
        });
    });

    describe('constructor', () => {
        it('should initialize with correct properties', () => {
            expect(rule.getID()).toBe('test_float_rule');
            expect(rule.getDefaultValue()).toBe(0);
        });

        it('should use the provided defaultValue', () => {
            const r = new FloatRule({
                category: 'test',
                identifier: 'float_with_default',
                defaultValue: 0.5,
                valueRange: { range: { min: 0.0, max: 1.0 } }
            });
            expect(r.getDefaultValue()).toBe(0.5);
        });
    });

    describe('getDescription', () => {
        it('should return a rawtext object containing the description and default value', () => {
            const desc = rule.getDescription();
            expect(desc.rawtext).toBeDefined();
            expect(desc.rawtext[0]).toEqual({ text: 'Test float rule' });
            expect(desc.rawtext[2]).toEqual({ translate: 'rules.generic.defaultvalue', with: ['0'] });
        });
    });

    describe('getType', () => {
        it('should return "float"', () => {
            expect(rule.getType()).toBe('float');
        });
    });

    describe('isInDomain', () => {
        it('should return true for numbers', () => {
            expect(rule.isInDomain(0.5)).toBe(true);
        });

        it('should return true for integers (integers are numbers)', () => {
            expect(rule.isInDomain(1)).toBe(true);
        });

        it('should return false for non-numbers', () => {
            expect(rule.isInDomain('hello')).toBe(false);
        });
    });

    describe('getAllowedValues', () => {
        it('should return the value range', () => {
            expect(rule.getAllowedValues()).toEqual({ range: { min: 0.0, max: 1.0 } });
        });
    });

    describe('isInRange', () => {
        it('should return true for values within range', () => {
            expect(rule.isInRange(0.5)).toBe(true);
        });

        it('should return false for values outside range', () => {
            expect(rule.isInRange(1.5)).toBe(false);
        });

        it('should return true for values in the other array', () => {
            const r = new FloatRule({
                category: 'test',
                identifier: 'float_with_other',
                valueRange: { range: { min: 0.0, max: 1.0 }, other: [99.9] }
            });
            expect(r.isInRange(99.9)).toBe(true);
        });
    });
});
