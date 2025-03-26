import { allowBubbleColumnPlacement } from "../../../../../Canopy [BP]/scripts/src/rules/allowBubbleColumnPlacement";
import { expect, test, describe, vi, afterEach } from "vitest";

vi.mock("@minecraft/server", () => ({
    system: {
        afterEvents: {
            scriptEventReceive: {
                subscribe: vi.fn()
            },
            playerPlaceBlock: {
                subscribe: vi.fn()
            }
        },
        runJob: vi.fn(),
        run: vi.fn((callback) => callback())
    },
    world: {
        beforeEvents: {
            chatSend: {
                subscribe: vi.fn()
            },
            playerPlaceBlock: {
                subscribe: vi.fn(),
                unsubscribe: vi.fn()
            }
        },
        afterEvents: {
            worldLoad: {
                subscribe: vi.fn()
            }
        },
        getDynamicProperty: vi.fn(),
        setDynamicProperty: vi.fn(),
        structureManager: {
            place: vi.fn()
        }
    }
}));

vi.mock("@minecraft/server-ui", () => ({
    ModalFormData: vi.fn()
}));

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
            player: { getComponent: vi.fn(() => ({ getEquipment: vi.fn(() => ({ typeId: 'minecraft:bubble_column' }) ) }) ) },
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