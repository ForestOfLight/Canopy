import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EndGatewayExitRender } from '../../../../../Canopy[BP]/scripts/src/classes/EndGatewayExitRender';
import { debugDrawer } from '@minecraft/debug-utilities';

describe('EndGatewayExitRender', () => {
    const dimension = { id: 'minecraft:the_end' };
    const location = { x: 5, y: 64, z: 5 };
    let render;

    beforeEach(() => {
        render = new EndGatewayExitRender(dimension, location, 32);
    });

    afterEach(() => {
        render.destroy();
    });

    describe('constructor', () => {
        it('sets dimension, location, and searchAreaSize', () => {
            expect(render.dimension).toEqual(dimension);
            expect(render.location).toEqual({ x: 5, y: 64, z: 5 });
            expect(render.searchAreaSize).toBe(32);
        });

        it('defaults searchAreaSize to 1 when omitted', () => {
            const r = new EndGatewayExitRender(dimension, location);
            expect(r.searchAreaSize).toBe(1);
            r.destroy();
        });

        it('renders shapes on construction', () => {
            expect(render.debugShapes.length).toBeGreaterThan(0);
            expect(debugDrawer.addShape).toHaveBeenCalled();
        });
    });

    describe('destroy', () => {
        it('calls remove on each debug shape', () => {
            const mockShape = { remove: vi.fn() };
            render.debugShapes.push(mockShape);
            render.destroy();
            expect(mockShape.remove).toHaveBeenCalled();
        });

        it('clears the debugShapes array', () => {
            render.destroy();
            expect(render.debugShapes).toHaveLength(0);
        });
    });

    describe('drawShape', () => {
        it('registers the shape with debugDrawer and tracks it in debugShapes', () => {
            const shape = { remove: vi.fn() };
            render.drawShape(shape);
            expect(debugDrawer.addShape).toHaveBeenCalledWith(shape);
            expect(render.debugShapes).toContain(shape);
        });
    });
});
