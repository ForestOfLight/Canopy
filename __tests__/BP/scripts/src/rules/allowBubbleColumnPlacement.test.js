import { allowBubbleColumnPlacement } from "../../../../../Canopy[BP]/scripts/src/rules/allowBubbleColumnPlacement";
import { expect, test, describe, vi, afterEach } from "vitest";

vi.mock("@minecraft/server", async (importOriginal) => {
    const original = await importOriginal();
    return {
        ...original,
        system: {
            ...original.system,
            run: vi.fn((callback) => callback())
        }
    };
});

describe('allowBubbleColumnPlacement', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    test('should subscribe to player block placements when enabled', () => {
        const subscribeSpy = vi.spyOn(allowBubbleColumnPlacement, 'subscribeToEvent');
        allowBubbleColumnPlacement.onEnable();
        expect(subscribeSpy).toHaveBeenCalled();
        subscribeSpy.mockRestore();
    });

    test('should unsubscribe from player block placements when disabled', () => {
        const unsubscribeSpy = vi.spyOn(allowBubbleColumnPlacement, 'unsubscribeFromEvent');
        allowBubbleColumnPlacement.onDisable();
        expect(unsubscribeSpy).toHaveBeenCalled();
        unsubscribeSpy.mockRestore();
    });

    test('should ensure placement when placing bubble column', () => {
        const placeBubbleColumnSpy = vi.spyOn(allowBubbleColumnPlacement, 'placeBubbleColumn')
        const event = {
            player: { name: 'MockPlayer' },
            permutationToPlace: { type: { id: 'minecraft:bubble_column' } },
            dimension: 'overworld',
            block: { location: { x: 0, y: 0, z: 0 } }
        };
        allowBubbleColumnPlacement.onPlayerPlaceBlock(event);
        expect(placeBubbleColumnSpy).toHaveBeenCalledWith('overworld', { x: 0, y: 0, z: 0 });
    });

    test('should do nothing if placed by a Simulated Player', () => {
        const placeBubbleColumnSpy = vi.spyOn(allowBubbleColumnPlacement, 'placeBubbleColumn')
        const event = {
            player: void 0,
            dimension: 'overworld',
            block: { location: { x: 0, y: 0, z: 0 } }
        };
        allowBubbleColumnPlacement.onPlayerPlaceBlock(event);
        expect(placeBubbleColumnSpy).not.toHaveBeenCalled();
    });
});