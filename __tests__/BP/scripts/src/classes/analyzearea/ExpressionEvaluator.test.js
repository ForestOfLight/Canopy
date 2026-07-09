import { describe, it, expect, vi } from 'vitest';

vi.mock('@minecraft/server', () => ({
    ItemStack: class {
        constructor(typeId, amount = 1) {
            this.typeId = typeId;
            this.amount = amount;
        }
    }
}));

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

        it('rejects computed access to a forbidden key at runtime', () => {
            const evaluator = new ExpressionEvaluator("block['constr' + 'uctor']");
            expect(() => evaluator.evaluate(makeBlock())).toThrow(/Forbidden property access: constructor/);
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

        it('allows safe built-in JS methods on values', () => {
            expect(new ExpressionEvaluator("typeId.includes('redstone')").evaluate(makeBlock())).toBe(true);
            expect(new ExpressionEvaluator("typeId.startsWith('minecraft:')").evaluate(makeBlock())).toBe(true);
            expect(new ExpressionEvaluator('typeId.toUpperCase()').evaluate(makeBlock())).toBe('MINECRAFT:REDSTONE_WIRE');
        });

        it('still rejects invocation-redirection escapes (call/apply/bind)', () => {
            expect(() => new ExpressionEvaluator("block.setType.call(block, 'minecraft:tnt')")).toThrow(/Forbidden method call: call/);
            expect(() => new ExpressionEvaluator('block.setType.apply(block)')).toThrow(/Forbidden method call: apply/);
            expect(() => new ExpressionEvaluator("hasTag.bind(block)")).toThrow(/Forbidden method call: bind/);
        });
    });

    describe('new ItemStack', () => {
        it('constructs an ItemStack with its arguments', () => {
            expect(new ExpressionEvaluator("new ItemStack('minecraft:diamond')").evaluate({})).toEqual({ typeId: 'minecraft:diamond', amount: 1 });
            expect(new ExpressionEvaluator("new ItemStack('minecraft:arrow', 16)").evaluate({})).toEqual({ typeId: 'minecraft:arrow', amount: 16 });
        });

        it('evaluates constructor arguments against the block', () => {
            expect(new ExpressionEvaluator('new ItemStack(typeId)').evaluate(makeBlock())).toEqual({ typeId: 'minecraft:redstone_wire', amount: 1 });
        });

        it('rejects constructing any class other than ItemStack', () => {
            expect(() => new ExpressionEvaluator("new Player('x')")).toThrow(/Only 'new ItemStack/);
            expect(() => new ExpressionEvaluator('new Date()')).toThrow(/Only 'new ItemStack/);
        });

        it('rejects new with a non-identifier callee', () => {
            expect(() => new ExpressionEvaluator("new block.constructor('x')")).toThrow();
        });
    });
});
