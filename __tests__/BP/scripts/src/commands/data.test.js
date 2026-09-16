import { describe, it, expect } from "vitest";
import { formatObject } from "../../../../../Canopy[BP]/scripts/src/commands/data";

describe('formatObject', () => {
    it('should format a flat object', () => {
        expect(formatObject(null, { name: 'Steve', age: 3 })).toBe('{name="Steve", age=3}');
    });

    it('should not escape nested objects', () => {
        expect(formatObject(null, { owner: { name: 'Steve' }, age: 3 })).toBe('{owner={name="Steve"}, age=3}');
    });

    it('should not escape deeply nested objects', () => {
        expect(formatObject(null, { a: { b: { name: 'Steve' } } })).toBe('{a={b={name="Steve"}}}');
    });

    it('should color nested objects when coloring the top level', () => {
        expect(formatObject(null, { owner: { name: 'Steve' } }, true)).toBe('§7{§7owner=§b{name="Steve"}§7}§r');
    });

    it('should skip functions', () => {
        expect(formatObject(null, { name: 'Steve', greet: () => 'hi' })).toBe('{name="Steve"}');
    });

    it('should replace self-references with this', () => {
        const target = { id: 1 };
        expect(formatObject(target, { self: target, id: 1 })).toBe('{self="this", id=1}');
    });

    it('should handle an empty object', () => {
        expect(formatObject(null, {})).toBe('{}');
    });
});
