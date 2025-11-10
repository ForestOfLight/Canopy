import { vi, it, describe, expect } from "vitest";
import { echoShardsEnableShriekers } from "../../../../../Canopy [BP]/scripts/src/rules/echoShardsEnableShriekers";

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
            },
            playerInteractWithBlock: {
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
    },
    BlockPermutation: {
        resolve: (typeId, states) => ({
            typeId: typeId,
            getAllStates: () => states
        })
    },
    EntityComponentTypes: {
        Equippable: 'minecraft:equippable'
    },
    EquipmentSlot: {
        Mainhand: 'mainhand'
    },
    GameMode: {
        Creative: 'creative',
        Survival: 'survival'
    }
}));

vi.mock("@minecraft/server-ui", () => ({
    ModalFormData: vi.fn()
}));

describe('echoShardsEnableShriekers', () => {
    it('should subscribe to player block placements when enabled', () => {
        const subscribeSpy = vi.spyOn(echoShardsEnableShriekers, 'subscribeToEvent');
        echoShardsEnableShriekers.onEnable();
        expect(subscribeSpy).toHaveBeenCalled();
        subscribeSpy.mockRestore();
    });

    it('should unsubscribe from player block placements when disabled', () => {
        const unsubscribeSpy = vi.spyOn(echoShardsEnableShriekers, 'unsubscribeFromEvent');
        echoShardsEnableShriekers.onDisable();
        expect(unsubscribeSpy).toHaveBeenCalled();
        unsubscribeSpy.mockRestore();
    });

    it('should enable a shrieker when a player interacts with it using an echo shard and the rule is enabled', () => {
        const event = getSuccessfulEvent();
        echoShardsEnableShriekers.onPlayerInteractWithBlock(event);
        expect(event.block.setPermutation).toHaveBeenCalled();
    });

    it('should not enable a shrieker if the player is a simulated player', () => {
        const event = getSuccessfulEvent();
        event.player = void 0;
        echoShardsEnableShriekers.onPlayerInteractWithBlock(event);
        expect(event.block.setPermutation).not.toHaveBeenCalled();
    });

    it('should not enable a shrieker if the interaction item is not an echo shard', () => {
        const event = getSuccessfulEvent();
        event.itemStack.typeId = 'minecraft:grass_block';
        echoShardsEnableShriekers.onPlayerInteractWithBlock(event);
        expect(event.block.setPermutation).not.toHaveBeenCalled();
    });

    it('should not enable a shrieker if the block is not a sculk shrieker', () => {
        const event = getSuccessfulEvent();
        event.block.typeId = 'minecraft:grass_block';
        echoShardsEnableShriekers.onPlayerInteractWithBlock(event);
        expect(event.block.setPermutation).not.toHaveBeenCalled();
    });

    it('should consume an echo shard during successful activation', () => {
        const event = getSuccessfulEvent();
        echoShardsEnableShriekers.onPlayerInteractWithBlock(event);
        expect(event.player.getComponent().setEquipment).toHaveBeenCalledWith('mainhand', event.itemStack);
    });

    it('should consume the entire itemStack if only one echo shard is left during successful activation', () => {
        const event = getSuccessfulEvent();
        event.itemStack.amount = 1;
        echoShardsEnableShriekers.onPlayerInteractWithBlock(event);
        expect(event.player.getComponent().setEquipment).toHaveBeenCalledWith('mainhand', void 0);
    });

    it('should not consume an echo shard if the player is in creative mode', () => {
        const event = getSuccessfulEvent();
        event.player.getGameMode.mockReturnValueOnce('creative');
        echoShardsEnableShriekers.onPlayerInteractWithBlock(event);
        expect(event.itemStack.amount).toBe(10);
    });

    it('should not attempt activation if the shrieker is already active', () => {
        const event = getSuccessfulEvent();
        event.block.permutation.getAllStates.mockReturnValueOnce({
            active: false,
            // eslint-disable-next-line camelcase
            can_summon: true
        })
        echoShardsEnableShriekers.onPlayerInteractWithBlock(event);
        expect(event.block.setPermutation).not.toHaveBeenCalled();
    })
});

function getSuccessfulEvent() {
    const setEquipmentSpy = vi.fn();
    const itemStack = { 
        typeId: 'minecraft:echo_shard', 
        amount: 10
    };
    return {
        block: {
            typeId: 'minecraft:sculk_shrieker',
            permutation: {
                getAllStates: vi.fn(() => ({
                    active: false,
                    // eslint-disable-next-line camelcase
                    can_summon: false
                }))
            },
            setPermutation: vi.fn()
        },
        player: { 
            isValid: true,
            getComponent: () => ({
                getEquipment: () => itemStack,
                setEquipment: setEquipmentSpy
            }),
            getGameMode: vi.fn(() => 'survival')
        },
        itemStack
    };
}
