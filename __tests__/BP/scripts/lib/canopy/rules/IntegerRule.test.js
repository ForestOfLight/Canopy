import { describe, it, expect, beforeEach } from 'vitest';
import { IntegerRule } from '../../../../../../Canopy[BP]/scripts/lib/canopy/rules/IntegerRule.js';
import { Rules } from '../../../../../../Canopy[BP]/scripts/lib/canopy/rules/Rules.js';

describe('IntegerRule', () => {
    let rule;

    beforeEach(() => {
        Rules.clear();
        rule = new IntegerRule({
            category: 'test',
            identifier: 'test_int_rule',
            description: 'Test integer rule',
            valueRange: { range: { min: 0, max: 10 } }
        });
    });

    describe('constructor', () => {
        it('should initialize with correct properties', () => {
            expect(rule.getID()).toBe('test_int_rule');
            expect(rule.getDefaultValue()).toBe(0);
        });

        it('should use the provided defaultValue', () => {
            const r = new IntegerRule({
                category: 'test',
                identifier: 'int_with_default',
                defaultValue: 5,
                valueRange: { range: { min: 0, max: 10 } }
            });
            expect(r.getDefaultValue()).toBe(5);
        });
    });

    describe('getDescription', () => {
        it('should return a rawtext object containing the description and default value', () => {
            const desc = rule.getDescription();
            expect(desc.rawtext).toBeDefined();
            expect(desc.rawtext[0]).toEqual({ text: 'Test integer rule' });
            expect(desc.rawtext[2]).toEqual({ translate: 'rules.generic.defaultvalue', with: ['0'] });
        });
    });

    describe('getType', () => {
        it('should return "integer"', () => {
            expect(rule.getType()).toBe('integer');
        });
    });

    describe('isInDomain', () => {
        it('should return true for integers', () => {
            expect(rule.isInDomain(5)).toBe(true);
        });

        it('should return false for non-integers', () => {
            expect(rule.isInDomain(1.5)).toBe(false);
        });
    });

    describe('getAllowedValues', () => {
        it('should return the value range', () => {
            expect(rule.getAllowedValues()).toEqual({ range: { min: 0, max: 10 } });
        });
    });

    describe('isInRange', () => {
        it('should return true for values within range', () => {
            expect(rule.isInRange(5)).toBe(true);
        });

        it('should return false for values outside range', () => {
            expect(rule.isInRange(11)).toBe(false);
        });

        it('should return true for values in the other array', () => {
            const r = new IntegerRule({
                category: 'test',
                identifier: 'int_with_other',
                valueRange: { range: { min: 0, max: 10 }, other: [100] }
            });
            expect(r.isInRange(100)).toBe(true);
        });
    });
});
