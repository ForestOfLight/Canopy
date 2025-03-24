import { allowPeekInventory } from "../../../../../Canopy [BP]/scripts/src/rules/allowPeekInventory";
import { expect, it, describe, vi, afterEach } from "vitest";
import { InventoryUI } from "../../../../../Canopy [BP]/scripts/src/classes/InventoryUI";

vi.mock("@minecraft/server", () => ({
    system: {
        afterEvents: {
            scriptEventReceive: {
                subscribe: vi.fn()
            }
        },
        runJob: vi.fn(),
        currentTick: (Date.now() / 50),
        runInterval: vi.fn((callback, interval) => {
            const intervalId = setInterval(callback, interval * 50);
            return {
                clear: () => clearInterval(intervalId)
            };
        }),
        clearRun: vi.fn((runner) => {
            runner.clear();
        }),
        run: vi.fn((callback) => {
            callback();
        })
    },
    world: {
        beforeEvents: {
            chatSend: {
                subscribe: vi.fn()
            },
            playerInteractWithBlock: {
                subscribe: vi.fn(),
                unsubscribe: vi.fn()
            },
            playerInteractWithEntity: {
                subscribe: vi.fn(),
                unsubscribe: vi.fn()
            }
        },
        getDynamicProperty: vi.fn(),
        setDynamicProperty: vi.fn()
    },
    EntityComponentTypes: {
        Inventory: 'inventory'
    },
    ItemComponentTypes: {
        Durability: 'durability',
        Enchantable: 'enchantable'
    }
}));

vi.mock("@minecraft/server-ui", () => ({
    ModalFormData: vi.fn()
}));

describe('allowPeekInventory', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should subscribe to player block placements when enabled', () => {
        const subscribeSpy = vi.spyOn(allowPeekInventory, 'subscribeToEvent');
        allowPeekInventory.onEnable();
        expect(subscribeSpy).toHaveBeenCalled();
    });

    it('should unsubscribe from player block placements when disabled', () => {
        const unsubscribeSpy = vi.spyOn(allowPeekInventory, 'unsubscribeFromEvent');
        allowPeekInventory.onDisable();
        expect(unsubscribeSpy).toHaveBeenCalled();
    });

    it('should show the inventory UI when a player holds the spyglass and interacts with an entity', () => {
        const showSpy = vi.spyOn(InventoryUI.prototype, 'show');
        const target = {
            typeId: 'minecraft:test_target', 
            getComponent: vi.fn().mockReturnValue({ 
                container: { 
                    size: 5,
                    getItem: vi.fn().mockReturnValue({
                        typeId: 'minecraft:test_item',
                        amount: 1,
                        getComponent: vi.fn().mockReturnValue({
                            damage: 10,
                            maxDurability: 20,
                            getEnchantments: () => [{ type: { id: 'minecraft:test_enchantment' }, level: 1 }]
                        })
                    })
                }
            })
        };
        const player = {
            typeId: 'minecraft:player',
            sendMessage: vi.fn()
        }
        const itemStack = { typeId: 'minecraft:spyglass' };
        const mockEvent = { player, target, itemStack };
        allowPeekInventory.onPlayerInteraction(mockEvent);
        expect(showSpy).toHaveBeenCalled();
    });

    it('should show the inventory UI when a player holds the spyglass and interacts with a block', () => {
        const showSpy = vi.spyOn(InventoryUI.prototype, 'show');
        const block = {
            typeId: 'minecraft:test_target', 
            getComponent: vi.fn().mockReturnValue({ 
                container: { 
                    size: 5,
                    getItem: vi.fn().mockReturnValue({
                        typeId: 'minecraft:test_item',
                        amount: 1,
                        getComponent: vi.fn().mockReturnValue({
                            damage: 10,
                            maxDurability: 20,
                            getEnchantments: () => [{ type: { id: 'minecraft:test_enchantment' }, level: 1 }]
                        })
                    })
                }
            })
        };
        const player = {
            typeId: 'minecraft:player',
            sendMessage: vi.fn()
        }
        const itemStack = { typeId: 'minecraft:spyglass' };
        const mockEvent = { player, target: block, itemStack };
        allowPeekInventory.onPlayerInteraction(mockEvent);
        expect(showSpy).toHaveBeenCalled();
    });

    it('should not show the inventory UI if the player does not hold a spyglass', () => {
        const showSpy = vi.spyOn(InventoryUI.prototype, 'show');
        const target = { typeId: 'minecraft:test_target' };
        const player = {
            typeId: 'minecraft:player',
            sendMessage: vi.fn()
        }
        const itemStack = { typeId: 'minecraft:not_a_spyglass' };
        const mockEvent = { player, target, itemStack };
        allowPeekInventory.onPlayerInteraction(mockEvent);
        expect(showSpy).not.toHaveBeenCalled();
    });

    it('should not show the inventory UI if the target does not have an inventory', () => {
        const showSpy = vi.spyOn(InventoryUI.prototype, 'show');
        const target = {
            typeId: 'minecraft:test_target', 
            getComponent: vi.fn().mockReturnValue(void 0)
        };
        const player = {
            typeId: 'minecraft:player',
            sendMessage: vi.fn()
        }
        const itemStack = { typeId: 'minecraft:spyglass' };
        const mockEvent = { player, target, itemStack };
        allowPeekInventory.onPlayerInteraction(mockEvent);
        expect(showSpy).not.toHaveBeenCalled();
    });
});