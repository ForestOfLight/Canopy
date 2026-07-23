import { describe, it, expect } from 'vitest';
import { debugDrawer, getDrawnShapes } from '@minecraft/debug-utilities';
import {
    deserializeShape,
    VoxelizableDebugLine,
    VoxelizableDebugBox,
    VoxelizableDebugSquare,
    VoxelizableDebugCircle,
    VoxelizableDebugEllipse,
    VoxelizableDebugArc,
    VoxelizableDebugSphere
} from '../../../../../Canopy[BP]/scripts/lib/VoxelizableDebugShapes/index.js';

/** JSON round-trip, mimicking DrawManager's dynamic-property persistence. */
const persist = (obj) => JSON.parse(JSON.stringify(obj));

describe('shape serialization', () => {
    it('every shape carries a distinct type discriminator', () => {
        const cases = [
            [new VoxelizableDebugLine({ from: { x: 0, y: 0, z: 0 }, to: { x: 1, y: 0, z: 0 } }), 'line'],
            [new VoxelizableDebugBox({ center: { x: 0, y: 0, z: 0 }, size: { x: 2, y: 2, z: 2 } }), 'box'],
            [new VoxelizableDebugSquare({ center: { x: 0, y: 0, z: 0 }, width: 4, height: 2 }), 'square'],
            [new VoxelizableDebugCircle({ center: { x: 0, y: 0, z: 0 }, radius: 5 }), 'circle'],
            [new VoxelizableDebugEllipse({ center: { x: 0, y: 0, z: 0 }, radii: { x: 6, z: 3 } }), 'ellipse'],
            [new VoxelizableDebugArc({ center: { x: 0, y: 0, z: 0 }, radius: 5, startAngle: 0, endAngle: 90 }), 'arc'],
            [new VoxelizableDebugSphere({ center: { x: 0, y: 0, z: 0 }, radius: 6 }), 'sphere']
        ];
        for (const [shape, type] of cases)
            expect(shape.serialize().type).toBe(type);
    });

    it('round-trips a circle config through JSON and deserializeShape', () => {
        const original = new VoxelizableDebugCircle({
            center: { x: 1, y: 2, z: 3 }, radius: 8,
            rotation: { x: 0, y: 90, z: 0 },
            mode: 'voxel', innerEdge: true, outerEdge: true, fill: false
        });
        const restored = deserializeShape(persist(original.serialize()));
        expect(restored).toBeInstanceOf(VoxelizableDebugCircle);
        expect(restored.serialize()).toEqual(original.serialize());
    });

    it('preserves the from/to form of a box without inventing center/size', () => {
        const box = new VoxelizableDebugBox({ from: { x: 0, y: 0, z: 0 }, to: { x: 2, y: 1, z: 2 } });
        const cfg = box.serialize();
        expect(cfg.from).toEqual({ x: 0, y: 0, z: 0 });
        expect(cfg.to).toEqual({ x: 2, y: 1, z: 2 });
        expect(cfg).not.toHaveProperty('center');
        expect(cfg).not.toHaveProperty('size');
    });

    it('serializes dimension, attachedTo, and visibleTo as id strings', () => {
        const shape = new VoxelizableDebugCircle({
            center: { x: 0, y: 0, z: 0 }, radius: 4,
            dimension: { id: 'minecraft:the_nether' },
            attachedTo: { id: 'ent-1' },
            visibleTo: [{ id: 'player-a' }, { id: 'player-b' }]
        });
        const cfg = shape.serialize();
        expect(cfg.dimension).toBe('minecraft:the_nether');
        expect(cfg.attachedTo).toBe('ent-1');
        expect(cfg.visibleTo).toEqual(['player-a', 'player-b']);
        // and survives JSON untouched
        expect(persist(cfg)).toEqual(cfg);
    });

    it('attempts to persist a function color and rebuilds it on deserialize', () => {
        const original = new VoxelizableDebugCircle({
            center: { x: 0, y: 0, z: 0 }, radius: 5, mode: 'smooth',
            color: () => ({ red: 1, green: 0, blue: 0, alpha: 1 })
        });
        const cfg = persist(original.serialize());
        expect(typeof cfg.color.fn).toBe('string'); // saved as source text (JSON-safe)

        const restored = deserializeShape(cfg);
        expect(typeof restored.color).toBe('function'); // rebuilt into a callable
        restored.draw();
        expect(getDrawnShapes(debugDrawer)[0].color).toEqual({ red: 1, green: 0, blue: 0, alpha: 1 });
    });

    it('falls back gracefully when a function color cannot be rebuilt', () => {
        // A malformed source string must not throw during deserialize.
        const restored = deserializeShape({ type: 'circle', center: { x: 0, y: 0, z: 0 }, radius: 3, color: { fn: 'this is not valid js (' } });
        expect(restored.color).toBeUndefined();
    });

    it('round-trips a from/to line through the factory', () => {
        const line = new VoxelizableDebugLine({ from: { x: 0, y: 0, z: 0 }, to: { x: 5, y: 2, z: 3 }, mode: 'voxel' });
        const restored = deserializeShape(persist(line.serialize()));
        expect(restored).toBeInstanceOf(VoxelizableDebugLine);
        expect(restored.serialize()).toEqual(line.serialize());
    });

    it('rejects an unknown shape type', () => {
        expect(() => deserializeShape({ type: 'hexahedron' })).toThrow();
    });
});
