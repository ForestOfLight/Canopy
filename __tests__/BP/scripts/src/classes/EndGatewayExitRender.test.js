import { beforeAll, describe, expect, it, vi } from "vitest";
import { EndGatewayExitRender } from "../../../../../Canopy[BP]/scripts/src/classes/EndGatewayExitRender";

describe('EndGatewayExitRender', () => {
    let exitRender;
    beforeAll(() => {
        const dimension = { id: "minecraft:the_end" };
        const location = { x: 0, y: 0, z: 0 };
        exitRender = new EndGatewayExitRender(dimension, location);
    });

    describe('constructor', () => {
        it('should initialize properties correctly', () => {
            expect(exitRender.location).toEqual({ x: 0, y: 0, z: 0 });
            expect(exitRender.dimension).toEqual({ id: "minecraft:the_end" });
        });

        it('should render the gateway exit', () => {
            expect(exitRender.debugShapes.length).toBeGreaterThan(0);
        });
    });

    describe('destroy', () => {
        it('should remove all debug shapes', () => {
            const mockShape = { remove: vi.fn() };
            exitRender.debugShapes.push(mockShape);
            exitRender.destroy();
            expect(mockShape.remove).toHaveBeenCalled();
            expect(exitRender.debugShapes.length).toBe(0);
        });
    });
});