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
        const target = { typeId: "minecraft:player", id: 1 };
        expect(formatObject(target, { self: target, id: 1 })).toBe('{self=§d{§7§5(...)§7, §7id=§b1§7, §7typeId=§b"minecraft:player"§7§d}§r, id=1}');
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
        expect(formatObject(entity, { entity: wrapper })).toBe('{entity=§d{§7§5(...)§7, §7id=§b"-4294967295"§7, §7typeId=§b"minecraft:cow"§7, §7location=§b{x=1, y=2, z=3}§7, §7dimension=§b{id="minecraft:overworld"}§7§d}§r}');
    });

    it('should expand a different entity', () => {
        const other = { id: '-4294967296', typeId: 'minecraft:cow', location: { x: 1, y: 2, z: 3 }, dimension: { id: 'minecraft:overworld' } };
        expect(formatObject(entity, { entity: other })).toContain('id="-4294967296"');
    });

    it('should recognize another wrapper of the same block', () => {
        const wrapper = { typeId: block.typeId, location: { x: 1, y: 2, z: 3 }, dimension: { id: 'minecraft:overworld' } };
        expect(formatObject(block, { block: wrapper })).toBe('{block=§d{§7§5(...)§7, §7typeId=§b"minecraft:chest"§7, §7location=§b{x=1, y=2, z=3}§7, §7dimension=§b{id="minecraft:overworld"}§7§d}§r}');
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
        expect(formatObject(entity, { a: { b: { owner: wrapper } } })).toBe('{a={b={owner=§d{§7§5(...)§7, §7id=§b"-4294967295"§7, §7typeId=§b"minecraft:cow"§7, §7location=§b{x=1, y=2, z=3}§7, §7dimension=§b{id="minecraft:overworld"}§7§d}§r}}}');
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
    it('should not memoize primitives', () => {
        const entity = { id: '-4294967295', typeId: 'minecraft:snow_golem', nameTag: 'minecraft:snow_golem', location: { x: 0, y: 0, z: 1 }, viewDirection: { x: 0, y: 0, z: 1 }, dimension: { id: 'minecraft:overworld' } };

        expect(formatObject(null, entity)).toBe('{id="-4294967295", typeId="minecraft:snow_golem", nameTag="minecraft:snow_golem", location={x=0, y=0, z=1}, viewDirection={x=0, y=0, z=1}, dimension={id="minecraft:overworld"}}');
    });

    it('should not memoize dimensions', () => {
        const snowGolem = { id: '-4294967295', typeId: 'minecraft:snow_golem', location: { x: 1, y: 2, z: 3 }, dimension: { id: 'minecraft:overworld' } };
        const silverfish = { id: '-4294967294', typeId: 'minecraft:silverfish', location: { x: 4, y: 2, z: 3 }, dimension: { id: 'minecraft:overworld' } };

        snowGolem.target = silverfish;
        silverfish.target = snowGolem;
        expect(formatObject(null, silverfish)).toBe('{id="-4294967294", typeId="minecraft:silverfish", location={x=4, y=2, z=3}, dimension={id="minecraft:overworld"}, target={id="-4294967295", typeId="minecraft:snow_golem", location={x=1, y=2, z=3}, dimension={id="minecraft:overworld"}, target=§d{§7§5(...)§7, §7id=§b"-4294967294"§7, §7typeId=§b"minecraft:silverfish"§7, §7location=§b{x=4, y=2, z=3}§7, §7dimension=§b{id="minecraft:overworld"}§7§d}§r}}');
    });

    it('should replace a recursive reference not involving the original target', () => {
        const snowGolem = { id: '-4294967295', typeId: 'minecraft:snow_golem', location: { x: 1, y: 2, z: 3 } };
        const silverfish = { id: '-4294967294', typeId: 'minecraft:silverfish', location: { x: 4, y: 2, z: 3 } };
        const husk = { id: '-4294967293', typeId: 'minecraft:husk', location: { x: 1, y: 2, z: 5 } };

        snowGolem.target = silverfish;
        silverfish.target = snowGolem;
        husk.target = snowGolem;
        expect(formatObject(husk, silverfish)).toBe('{id="-4294967294", typeId="minecraft:silverfish", location={x=4, y=2, z=3}, target={id="-4294967295", typeId="minecraft:snow_golem", location={x=1, y=2, z=3}, target=§d{§7§5(...)§7, §7id=§b"-4294967294"§7, §7typeId=§b"minecraft:silverfish"§7, §7location=§b{x=4, y=2, z=3}§7§d}§r}}');
    });

    it('should replace a recursive reference in an array not involving the original target', () => {
        const player = { id: '-4294967295', typeId: 'minecraft:player', location: { x: 3, y: 2, z: 3 } };
        const llama = { id: '-4294967295', typeId: 'minecraft:llama', location: { x: 3, y: 2, z: 3 } };
        const boat = { id: '-4294967294', typeId: 'minecraft:boat', location: { x: 4, y: 2, z: 3 } };
        const zombie = { id: '-4294967293', typeId: 'minecraft:zombie', location: { x: 5, y: 2, z: 3 } };

        player.ride = boat;
        llama.ride = boat;
        boat.passengers = [player, llama];
        zombie.target = player;
        expect(formatObject(zombie, boat)).toBe('{id="-4294967294", typeId="minecraft:boat", location={x=4, y=2, z=3}, passengers={0={id="-4294967295", typeId="minecraft:player", location={x=3, y=2, z=3}, ride=§d{§7§5(...)§7, §7id=§b"-4294967294"§7, §7typeId=§b"minecraft:boat"§7, §7location=§b{x=4, y=2, z=3}§7§d}§r}, 1=§d{§7§5(...)§7, §7id=§b"-4294967295"§7, §7typeId=§b"minecraft:llama"§7, §7location=§b{x=3, y=2, z=3}§7§d}§r}}');
    });

    it('should replace a recursive reference not involving the original target, when the recursing property name changes', () => {
        const player = { id: '-4294967295', typeId: 'minecraft:player', location: { x: 1, y: 3, z: 3 } };
        const horse = { id: '-4294967294', typeId: 'minecraft:horse', location: { x: 1, y: 2, z: 3 } };
        const zombie = { id: '-4294967293', typeId: 'minecraft:zombie', location: { x: 1, y: 2, z: 5 } };

        player.ride = horse;
        horse.passenger = player;
        zombie.target = player;
        expect(formatObject(zombie, horse)).toBe('{id="-4294967294", typeId="minecraft:horse", location={x=1, y=2, z=3}, passenger={id="-4294967295", typeId="minecraft:player", location={x=1, y=3, z=3}, ride=§d{§7§5(...)§7, §7id=§b"-4294967294"§7, §7typeId=§b"minecraft:horse"§7, §7location=§b{x=1, y=2, z=3}§7§d}§r}}');
    });

    it('should replace an entity/block recursive reference not involving the original target', () => {
        const player = { id: '-4294967295', typeId: 'minecraft:player', location: { x: 1, y: 2, z: 3 } };
        const bed = { typeId: 'minecraft:bed', location: { x: 1, y: 2, z: 30 }, dimension: { id: 'minecraft:overworld' } };
        const zombie = { id: '-4294967293', typeId: 'minecraft:zombie', location: { x: 1, y: 2, z: 5 } };

        player.bed = bed;
        bed.owner = player;
        zombie.target = player;
        expect(formatObject(zombie, bed)).toBe('{typeId="minecraft:bed", location={x=1, y=2, z=30}, dimension={id="minecraft:overworld"}, owner={id="-4294967295", typeId="minecraft:player", location={x=1, y=2, z=3}, bed=§d{§7§5(...)§7, §7typeId=§b"minecraft:bed"§7, §7location=§b{x=1, y=2, z=30}§7, §7dimension=§b{id="minecraft:overworld"}§7§d}§r}}');
    });
})