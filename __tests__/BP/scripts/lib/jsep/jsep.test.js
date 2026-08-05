import { describe, it, expect } from 'vitest';
import jsep from '../../../../../Canopy[BP]/scripts/lib/jsep/jsep.js';

describe('vendored jsep', () => {
    it('parses a logical-and expression into an AST', () => {
        const ast = jsep("typeId === 'minecraft:stone' && x > 0");
        expect(ast.type).toBe('BinaryExpression');
        expect(ast.operator).toBe('&&');
    });

    it('throws on a syntax error', () => {
        expect(() => jsep('a &&')).toThrow();
    });
});
