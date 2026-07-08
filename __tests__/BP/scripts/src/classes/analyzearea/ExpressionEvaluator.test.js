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

    it('short-circuits && and || (does not evaluate the dead operand)', () => {
        // Right side would throw if evaluated; && must not evaluate it when the left is false.
        const andCase = new ExpressionEvaluator("typeId === 'minecraft:air' && missing.getState('x')");
        expect(() => andCase.evaluate(makeBlock())).not.toThrow();
        expect(andCase.evaluate(makeBlock())).toBe(false);

        // Right side would throw if evaluated; || must not evaluate it when the left is true.
        const orCase = new ExpressionEvaluator("typeId === 'minecraft:redstone_wire' || missing.getState('x')");
        expect(() => orCase.evaluate(makeBlock())).not.toThrow();
        expect(orCase.evaluate(makeBlock())).toBe(true);

        // Sanity: an eagerly-evaluated bare `missing.getState('x')` really does throw.
        expect(() => new ExpressionEvaluator("missing.getState('x')").evaluate(makeBlock())).toThrow();
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
        const evaluator = new ExpressionEvaluator('hasTag("x")');
        const block = { hasTag: () => { throw new Error('restricted'); } };
        expect(() => evaluator.evaluate(block)).toThrow('restricted');
    });

    describe('sandbox', () => {
        it('rejects the constructor/prototype escape at construction', () => {
            expect(() => new ExpressionEvaluator('block.constructor.constructor("return 1")()')).toThrow(/Forbidden property access: constructor/);
            expect(() => new ExpressionEvaluator('block.__proto__')).toThrow(/Forbidden property access: __proto__/);
            expect(() => new ExpressionEvaluator('hasTag.prototype')).toThrow(/Forbidden property access: prototype/);
        });

        it('rejects any access to dimension', () => {
            expect(() => new ExpressionEvaluator('block.dimension')).toThrow(/Forbidden property access: dimension/);
        });

        it('rejects computed access to a forbidden key at runtime', () => {
            const evaluator = new ExpressionEvaluator("block['dimen' + 'sion']");
            expect(() => evaluator.evaluate(makeBlock())).toThrow(/Forbidden property access: dimension/);
        });

        it('rejects calls to methods that are not read-only-safe', () => {
            expect(() => new ExpressionEvaluator("setPermutation('x')")).toThrow(/Forbidden method call: setPermutation/);
            expect(() => new ExpressionEvaluator("block.setType('minecraft:tnt')")).toThrow(/Forbidden method call: setType/);
            expect(() => new ExpressionEvaluator("runCommand('kill @a')")).toThrow(/Forbidden method call: runCommand/);
        });

        it('allows read-only method calls', () => {
            expect(new ExpressionEvaluator("permutation.getState('redstone_signal') === 7").evaluate(makeBlock())).toBe(true);
            expect(new ExpressionEvaluator("hasTag('wood')").evaluate({ hasTag: (t) => t === 'wood' })).toBe(true);
        });
    });
});
