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
        expect(formatObject(target, { self: target, id: 1 })).toBe('{self=this, id=1}');
    });

    it('should handle an empty object', () => {
        expect(formatObject(null, {})).toBe('{}');
    });
});

describe('formatObject target identity', () => {
    const entity = { id: '-4294967295', typeId: 'minecraft:cow', location: { x: 1, y: 2, z: 3 }, dimension: { id: 'minecraft:overworld' } };
    const block = { typeId: 'minecraft:chest', location: { x: 1, y: 2, z: 3 }, dimension: { id: 'minecraft:overworld' } };

    it('should recognize another wrapper of the same entity', () => {
        const wrapper = { id: entity.id, typeId: entity.typeId, location: { x: 1, y: 2, z: 3 }, dimension: { id: 'minecraft:overworld' } };
        expect(formatObject(entity, { entity: wrapper })).toBe('{entity=this}');
    });

    it('should expand a different entity', () => {
        const other = { id: '-4294967296', typeId: 'minecraft:cow', location: { x: 1, y: 2, z: 3 }, dimension: { id: 'minecraft:overworld' } };
        expect(formatObject(entity, { entity: other })).toContain('id="-4294967296"');
    });

    it('should recognize another wrapper of the same block', () => {
        const wrapper = { typeId: block.typeId, location: { x: 1, y: 2, z: 3 }, dimension: { id: 'minecraft:overworld' } };
        expect(formatObject(block, { block: wrapper })).toBe('{block=this}');
    });

    it('should expand a block at a different location', () => {
        const other = { typeId: block.typeId, location: { x: 9, y: 2, z: 3 }, dimension: { id: 'minecraft:overworld' } };
        expect(formatObject(block, { block: other })).toContain('x=9');
    });

    it('should expand a block in a different dimension', () => {
        const other = { typeId: block.typeId, location: { x: 1, y: 2, z: 3 }, dimension: { id: 'minecraft:the_nether' } };
        expect(formatObject(block, { block: other })).toContain('the_nether');
    });

    it('should not confuse an entity with a block at the same location', () => {
        expect(formatObject(block, { entity: entity })).toContain('id="-4294967295"');
    });

    it('should recognize the target nested several levels deep', () => {
        const wrapper = { id: entity.id, typeId: entity.typeId, location: { x: 1, y: 2, z: 3 }, dimension: { id: 'minecraft:overworld' } };
        expect(formatObject(entity, { a: { b: { owner: wrapper } } })).toBe('{a={b={owner=this}}}');
    });

    it('should not treat the dimension as the target', () => {
        expect(formatObject(entity, { dimension: entity.dimension })).toBe('{dimension={id="minecraft:overworld"}}');
    });

    it('should survive a property access that throws', () => {
        const hostile = { get id() { throw new Error('invalid entity'); } };
        expect(formatObject(entity, { hostile })).toBe('{hostile={}}');
    });
});

describe('formatObject memo', () => {
    it('should replace an entity self-reference not involving the original target', () => {
        const snowGolem = { id: '-4294967295', typeId: 'minecraft:snow_golem', location: { x: 1, y: 2, z: 3 }, dimension: { id: 'minecraft:overworld' } };
        const silverfish = { id: '-4294967294', typeId: 'minecraft:silverfish', location: { x: 4, y: 2, z: 3 }, dimension: { id: 'minecraft:overworld' } };
        const thirdPartyAggressor = { id: '-4294967293', typeId: 'minecraft:husk', location: { x: 1, y: 2, z: 5 }, dimension: { id: 'minecraft:overworld' } };

        snowGolem.target = silverfish;
        silverfish.target = snowGolem;
        thirdPartyAggressor.target = snowGolem;
        expect(formatObject(thirdPartyAggressor, silverfish)).toBe('{id="-4294967294", typeId="minecraft:silverfish", location={x=4, y=2, z=3}, dimension={id="minecraft:overworld"}, target={id="-4294967295", typeId="minecraft:snow_golem", location={x=1, y=2, z=3}, dimension=this, target=this}}');
    });
})