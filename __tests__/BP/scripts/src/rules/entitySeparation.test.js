import { vi, it, describe, expect, beforeEach } from "vitest";
import { entitySeparation } from "../../../../../Canopy [BP]/scripts/src/rules/entitySeparation";
import { Vector } from "../../../../../Canopy [BP]/scripts/lib/Vector";

vi.mock("@minecraft/server", () => ({
    system: {
        afterEvents: {
            scriptEventReceive: {
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
            }
        },
        afterEvents: {
            worldLoad: {
                subscribe: vi.fn()
            },
            pressurePlatePush: {
                subscribe: vi.fn(),
                unsubscribe: vi.fn()
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

describe('entitySeparation', () => {
    let successfulEvent = {};
    let sourceEntity = {};
    beforeEach(() => {
        sourceEntity = { 
            id: 0,
            isValid: true,
            typeId: 'minecraft:test_entity',
            teleport: vi.fn(),
            location: { x: 0, y: 0, z: 0 },
            dimension: {
                getEntitiesAtBlockLocation: vi.fn(() => ([
                    sourceEntity,
                    { id: 1 }
                ]))
            }
        };
        successfulEvent = {
            block: {
                offset: vi.fn(() => ({ 
                    typeId: 'minecraft:dropper', 
                    permutation: {
                        getState: vi.fn(() => 0)
                    }
                }))
            },
            source: sourceEntity
        };
        vi.restoreAllMocks();
    });

    it('should subscribe to pressure plate pushes when enabled', () => {
        const subscribeSpy = vi.spyOn(entitySeparation, 'subscribeToEvent');
        entitySeparation.onEnable();
        expect(subscribeSpy).toHaveBeenCalled();
    });

    it('should unsubscribe from pressure plate pushes when disabled', () => {
        const unsubscribeSpy = vi.spyOn(entitySeparation, 'unsubscribeFromEvent');
        entitySeparation.onDisable();
        expect(unsubscribeSpy).toHaveBeenCalled();
    });

    it('should move one entity on success', () => {
        entitySeparation.onPressurePlatePush(successfulEvent);
        expect(sourceEntity.teleport).toHaveBeenCalled();
    });

    it('should not succeed if a dropper is not next to the pressure plate', () => {
        successfulEvent.block.offset.mockReturnValue({ typeId: 'minecraft:air' });
        entitySeparation.onPressurePlatePush(successfulEvent);
        expect(sourceEntity.teleport).not.toHaveBeenCalled();
    });

    it('should not succeed if there is only one entity on the pressure plate', () => {
        sourceEntity.dimension.getEntitiesAtBlockLocation.mockReturnValue([{ id: 0 }]);
        entitySeparation.onPressurePlatePush(successfulEvent);
        expect(sourceEntity.teleport).not.toHaveBeenCalled();
    });

    it.each([
        [0, Vector.down],
        [1, Vector.up],
        [2, Vector.backward],
        [3, Vector.forward],
        [4, Vector.left],
        [5, Vector.right]
    ])('when the dropper facing_direction is %i, should separate with offset %o', (facingDirection, offset) => {
        const separateEntitySpy = vi.spyOn(entitySeparation, 'separateEntity');
        successfulEvent.block.offset = vi.fn(() => ({ 
            typeId: 'minecraft:dropper', 
            permutation: {
                getState: vi.fn(() => facingDirection)
            }
        }));
        entitySeparation.onPressurePlatePush(successfulEvent);
        expect(separateEntitySpy).toHaveBeenCalledWith(sourceEntity, offset);
    });

    it('should not keep player velocity after separation', () => {
        successfulEvent.source.typeId = 'minecraft:player';
        entitySeparation.onPressurePlatePush(successfulEvent);
        expect(sourceEntity.teleport).toHaveBeenCalledWith(new Vector(0, -1, 0), {});
    });
});