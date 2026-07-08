import { describe, it, expect } from 'vitest';
import { ExpressionEvaluator } from '../../../../../../Canopy[BP]/scripts/src/classes/analyzearea/ExpressionEvaluator.js';

function makeBlock() {
    return {
        typeId: 'minecraft:redstone_wire',
        x: 4,
        permutation: {
            getState: (name) => (name === 'redstone_signal' ? 7 : undefined)
        },
        getTags: () => ['powered', 'redstone']
    };
}

describe('ExpressionEvaluator', () => {
    it('resolves bare identifiers against the block', () => {
        const evaluator = new ExpressionEvaluator("typeId === 'minecraft:redstone_wire'");
        expect(evaluator.evaluate(makeBlock())).toBe(true);
    });

    it('resolves the `block` identifier to the block itself', () => {
        const evaluator = new ExpressionEvaluator("block.typeId === 'minecraft:redstone_wire'");
        expect(evaluator.evaluate(makeBlock())).toBe(true);
    });

    it('evaluates member calls with correct this binding', () => {
        const evaluator = new ExpressionEvaluator("permutation.getState('redstone_signal') > 0");
        expect(evaluator.evaluate(makeBlock())).toBe(true);
    });

    it('short-circuits && and ||', () => {
        const truthy = new ExpressionEvaluator("typeId === 'minecraft:redstone_wire' && permutation.getState('redstone_signal') === 7");
        expect(truthy.evaluate(makeBlock())).toBe(true);
        const falsy = new ExpressionEvaluator("typeId === 'minecraft:air' || permutation.getState('redstone_signal') > 10");
        expect(falsy.evaluate(makeBlock())).toBe(false);
    });

    it('applies arithmetic, comparison, and unary operators', () => {
        expect(new ExpressionEvaluator('x + 1 === 5').evaluate(makeBlock())).toBe(true);
        expect(new ExpressionEvaluator('!(x < 0)').evaluate(makeBlock())).toBe(true);
        expect(new ExpressionEvaluator('-x === -4').evaluate(makeBlock())).toBe(true);
    });

    it('throws on a syntax error at construction', () => {
        expect(() => new ExpressionEvaluator('a &&')).toThrow();
    });

    it('surfaces runtime errors from the block to the caller', () => {
        const evaluator = new ExpressionEvaluator('boom()');
        const block = { boom: () => { throw new Error('restricted'); } };
        expect(() => evaluator.evaluate(block)).toThrow('restricted');
    });
});
