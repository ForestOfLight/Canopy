import { describe, it, expect, beforeEach } from 'vitest';
import { debugDrawer } from '@minecraft/debug-utilities';
import { AnalyzeAreaRenderer } from '../../../../../../Canopy[BP]/scripts/src/classes/analyzearea/AnalyzeAreaRenderer.js';

describe('AnalyzeAreaRenderer', () => {
    const dimension = { id: 'minecraft:overworld' };
    const locations = [{ x: 0, y: 0, z: 0 }, { x: 1, y: 2, z: 3 }];
    let renderer;

    beforeEach(() => {
        debugDrawer.addShape.mockClear();
        renderer = new AnalyzeAreaRenderer(dimension, locations);
    });

    it('draws one box per location on show', () => {
        renderer.show();
        expect(debugDrawer.addShape).toHaveBeenCalledTimes(2);
        expect(renderer.visible).toBe(true);
    });

    it('show is idempotent', () => {
        renderer.show();
        renderer.show();
        expect(debugDrawer.addShape).toHaveBeenCalledTimes(2);
    });

    it('hide removes all shapes and can be re-shown', () => {
        renderer.show();
        const shapes = [...renderer.debugShapes];
        renderer.hide();
        shapes.forEach((s) => expect(s.remove).toHaveBeenCalled());
        expect(renderer.visible).toBe(false);
        renderer.show();
        expect(renderer.visible).toBe(true);
    });
});
