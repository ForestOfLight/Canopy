import { describe, it, expect, beforeEach, vi } from 'vitest';
import { debugDrawer, DebugText } from '@minecraft/debug-utilities';
import { AnalyzeAreaRenderer } from '../../../../../../Canopy[BP]/scripts/src/classes/analyzearea/AnalyzeAreaRenderer.js';

describe('AnalyzeAreaRenderer', () => {
    const dimension = { id: 'minecraft:overworld' };
    const min = { x: 0, y: 0, z: 0 };
    const max = { x: 2, y: 2, z: 2 };
    const locations = [{ x: 0, y: 0, z: 0 }, { x: 1, y: 2, z: 3 }];
    const statsText = 'Area Analysis stats';
    let renderer;

    beforeEach(() => {
        debugDrawer.addShape.mockClear();
        renderer = new AnalyzeAreaRenderer(dimension, min, max, locations, statsText);
    });

    describe('outline layer (box + stats text)', () => {
        it('draws a white region box and a stats text shape', () => {
            renderer.showOutline();
            expect(debugDrawer.addShape).toHaveBeenCalledTimes(2);
            expect(renderer.outlineShape).toBeDefined();
            expect(renderer.outlineShape.bound).toEqual({ x: 3, y: 3, z: 3 });
            expect(renderer.outlineShape.color).toEqual({ red: 1, green: 1, blue: 1, alpha: 1 });
            expect(renderer.textShape).toBeInstanceOf(DebugText);
        });

        it('showOutline is idempotent', () => {
            renderer.showOutline();
            renderer.showOutline();
            expect(debugDrawer.addShape).toHaveBeenCalledTimes(2);
        });

        it('setText wraps the body with the stats header and forwards it to the live text shape', () => {
            renderer.showOutline();
            renderer.textShape.setText = vi.fn();
            renderer.setText('Analyzing... 42%');
            const expected = { rawtext: [{ translate: 'commands.analyzearea.stats.header' }, { text: '\n' }, 'Analyzing... 42%'] };
            expect(renderer.statsText).toEqual(expected);
            expect(renderer.textShape.setText).toHaveBeenCalledWith(expected);
        });

        it('hideOutline removes both the box and the text', () => {
            renderer.showOutline();
            const box = renderer.outlineShape;
            const text = renderer.textShape;
            renderer.hideOutline();
            expect(box.remove).toHaveBeenCalled();
            expect(text.remove).toHaveBeenCalled();
            expect(renderer.outlineShape).toBeUndefined();
            expect(renderer.textShape).toBeUndefined();
        });
    });

    describe('match boxes', () => {
        it('draws one box per matching location on showMatches', () => {
            renderer.showMatches();
            expect(debugDrawer.addShape).toHaveBeenCalledTimes(2);
            expect(renderer.matchesVisible).toBe(true);
        });

        it('showMatches is idempotent', () => {
            renderer.showMatches();
            renderer.showMatches();
            expect(debugDrawer.addShape).toHaveBeenCalledTimes(2);
        });

        it('hideMatches removes all match boxes and can be re-shown', () => {
            renderer.showMatches();
            const shapes = [...renderer.matchShapes];
            renderer.hideMatches();
            shapes.forEach((s) => expect(s.remove).toHaveBeenCalled());
            expect(renderer.matchShapes).toHaveLength(0);
            expect(renderer.matchesVisible).toBe(false);
            renderer.showMatches();
            expect(renderer.matchesVisible).toBe(true);
        });
    });

    it('outline (box + text) is independent of the match-box toggle', () => {
        renderer.showOutline();
        renderer.showMatches();
        expect(debugDrawer.addShape).toHaveBeenCalledTimes(4); // box + text + 2 match boxes
        renderer.hideMatches();
        expect(renderer.outlineShape).toBeDefined();
        expect(renderer.textShape).toBeInstanceOf(DebugText);
        expect(renderer.matchShapes).toHaveLength(0);
    });

    it('destroy removes the outline, text, and match boxes', () => {
        renderer.showOutline();
        renderer.showMatches();
        const box = renderer.outlineShape;
        const text = renderer.textShape;
        const matches = [...renderer.matchShapes];
        renderer.destroy();
        expect(box.remove).toHaveBeenCalled();
        expect(text.remove).toHaveBeenCalled();
        matches.forEach((s) => expect(s.remove).toHaveBeenCalled());
        expect(renderer.outlineShape).toBeUndefined();
        expect(renderer.textShape).toBeUndefined();
        expect(renderer.matchShapes).toHaveLength(0);
    });
});
