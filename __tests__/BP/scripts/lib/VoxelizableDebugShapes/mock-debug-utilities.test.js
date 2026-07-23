import { describe, it, expect } from 'vitest';
import { DebugLine, debugDrawer, getDrawnShapes } from '@minecraft/debug-utilities';

describe('debug-utilities mock', () => {
    it('DebugLine stores its constructor args and is mutable', () => {
        const line = new DebugLine({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 });
        expect(line.location).toEqual({ x: 0, y: 0, z: 0 });
        expect(line.endLocation).toEqual({ x: 1, y: 0, z: 0 });
        line.setLocation({ x: 2, y: 2, z: 2 });
        expect(line.location).toEqual({ x: 2, y: 2, z: 2 });
        line.color = { red: 1, green: 0, blue: 0, alpha: 1 };
        expect(line.color.red).toBe(1);
    });

    it('getDrawnShapes reflects add/remove history', () => {
        const a = new DebugLine({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 });
        const b = new DebugLine({ x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 });
        debugDrawer.addShape(a);
        debugDrawer.addShape(b);
        debugDrawer.removeShape(a);
        expect(getDrawnShapes(debugDrawer)).toEqual([b]);
    });
});
