import { describe, it, expect, vi } from 'vitest';
import { debugDrawer, getDrawnShapes } from '@minecraft/debug-utilities';
import { VoxelizableDebugShape }
    from '../../../../../Canopy[BP]/scripts/lib/VoxelizableDebugShapes/VoxelizableDebugShape.js';

class TestShape extends VoxelizableDebugShape {
    constructor(config, groups) { super(config); this._groups = groups; }
    computeSegments() { this.computeCount = (this.computeCount || 0) + 1; return this._testGroups; }
    setGroups(g) { this._testGroups = g; this._markGeometry(); }
}
function make(groups, config = {}) {
    const s = new TestShape(config);
    s._testGroups = groups;
    return s;
}

describe('VoxelizableDebugShape', () => {
    it('draw() adds one DebugLine per segment with resolved endpoints', () => {
        const s = make([{ group: 'outer', segments: [0, 0, 0, 1, 0, 0] }],
            { color: { red: 1, green: 0, blue: 0, alpha: 1 } });
        s.draw();
        const drawn = getDrawnShapes(debugDrawer);
        expect(drawn.length).toBe(1);
        expect(drawn[0].location).toEqual({ x: 0, y: 0, z: 0 });
        expect(drawn[0].endLocation).toEqual({ x: 1, y: 0, z: 0 });
        expect(drawn[0].color).toEqual({ red: 1, green: 0, blue: 0, alpha: 1 });
    });

    it('reconcile reuses lines on shrink/grow', () => {
        const s = make([{ group: 'outer', segments: [0, 0, 0, 1, 0, 0, 1, 0, 0, 2, 0, 0] }]);
        s.draw();
        const first = s._pool[0];
        s.setGroups([{ group: 'outer', segments: [0, 0, 0, 1, 0, 0] }]);
        s.draw();
        expect(s._pool.length).toBe(1);
        expect(s._pool[0]).toBe(first); // reused, not recreated
    });

    it('reconcile reuses lines on grow', () => {
        const s = make([{ group: 'outer', segments: [0, 0, 0, 1, 0, 0] }]);
        s.draw();
        const first = s._pool[0];
        s.setGroups([{ group: 'outer', segments: [0, 0, 0, 1, 0, 0, 1, 0, 0, 2, 0, 0] }]);
        s.draw();
        expect(s._pool.length).toBe(2);
        expect(s._pool[0]).toBe(first); // reused, not recreated
    });

    it('appearance-only change does not recompute geometry', () => {
        const s = make([{ group: 'outer', segments: [0, 0, 0, 1, 0, 0] }]);
        s.draw();
        const before = s.computeCount;
        s.color = { red: 0, green: 1, blue: 0, alpha: 1 };
        s.draw();
        expect(s.computeCount).toBe(before); // no recompute
        expect(s._pool[0].color).toEqual({ red: 0, green: 1, blue: 0, alpha: 1 });
    });

    it('per-group color object resolves by group', () => {
        const s = make([{ group: 'inner', segments: [0, 0, 0, 1, 0, 0] }],
            { color: { inner: { red: 0, green: 0, blue: 1, alpha: 1 } } });
        s.draw();
        expect(s._pool[0].color).toEqual({ red: 0, green: 0, blue: 1, alpha: 1 });
    });

    it('per-group color defaults a missing group to white', () => {
        const s = make([{ group: 'outer', segments: [0, 0, 0, 1, 0, 0] }],
            { color: { inner: { red: 0, green: 0, blue: 1, alpha: 1 } } });
        s.draw();
        expect(s._pool[0].color).toEqual({ red: 1, green: 1, blue: 1, alpha: 1 });
    });

    it('dimension change re-applies to lines via appearance-only draw', () => {
        const s = make([{ group: 'outer', segments: [0, 0, 0, 1, 0, 0] }], { dimension: 'A' });
        s.draw();
        s.dimension = 'B';
        const before = s.computeCount;
        s.draw();
        expect(s._pool[0].location.dimension).toBe('B');
        expect(s.computeCount).toBe(before);
    });

    it('color callback receives endpoints', () => {
        const s = make([{ group: 'outer', segments: [0, 0, 0, 1, 2, 3] }],
            { color: (a, b) => ({ red: b.y, green: 0, blue: 0, alpha: 1 }) });
        s.draw();
        expect(s._pool[0].color.red).toBe(2);
    });

    it('remove() hides but keeps geometry; draw() re-adds without recompute', () => {
        const s = make([{ group: 'outer', segments: [0, 0, 0, 1, 0, 0] }]);
        s.draw();
        const line = s._pool[0];
        s.remove();
        expect(getDrawnShapes(debugDrawer).length).toBe(0);
        expect(s._pool.length).toBe(1);
        const before = s.computeCount;
        s.draw();
        expect(getDrawnShapes(debugDrawer)).toContain(line);
        expect(s.computeCount).toBe(before);
    });

    it('destroy() clears the pool', () => {
        const s = make([{ group: 'outer', segments: [0, 0, 0, 1, 0, 0] }]);
        s.draw();
        s.destroy();
        expect(s._pool.length).toBe(0);
        expect(getDrawnShapes(debugDrawer).length).toBe(0);
    });
});
