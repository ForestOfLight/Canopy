import { InventoryUI } from "../../../../../Canopy [BP]/scripts/src/classes/InventoryUI";
import { describe, it, expect, vi, afterEach } from "vitest";
import * as Utils from "../../../../../Canopy [BP]/scripts/include/utils";

vi.mock("@minecraft/server", () => ({
    EntityComponentTypes: {
        Inventory: 'inventory'
    },
    ItemComponentTypes: {
        Durability: 'durability',
        Enchantable: 'enchantable'
    },
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
    }
}));

vi.mock("@minecraft/server-ui", () => ({
    ModalFormData: vi.fn()
}));

describe('InventoryPeeker', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should create a new instance based on a target', () => {
        const target = { typeId: 'minecraft:test_target' };
        const ui = new InventoryUI(target);
        expect(ui).toBeInstanceOf(InventoryUI);
    });

    it('should store the target', () => {
        const target = { typeId: 'minecraft:test_target' };
        const ui = new InventoryUI(target);
        expect(ui.target).toEqual(target);
    });

    it('should have a method to show the inventory', () => {
        const target = { typeId: 'minecraft:test_target' };
        const ui = new InventoryUI(target);
        expect(ui.show).toBeDefined();
    });

    it('should show the inventory when show is called', () => {
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
        const ui = new InventoryUI(target);
        const forceShowSpy = vi.spyOn(Utils, 'forceShow');
        ui.show(player);
        expect(forceShowSpy).toHaveBeenCalledWith(player, { slotCount: 5 });
    });

    it('should handle empty item slots', () => {
        const target = {
            typeId: 'minecraft:test_target', 
            getComponent: vi.fn().mockReturnValue({ 
                container: { 
                    size: 5,
                    getItem: vi.fn().mockReturnValue(void 0)
                }
            })
        };
        const player = {
            typeId: 'minecraft:player',
            sendMessage: vi.fn()
        }
        const ui = new InventoryUI(target);
        const forceShowSpy = vi.spyOn(Utils, 'forceShow');
        ui.show(player);
        expect(forceShowSpy).toHaveBeenCalledWith(player, { slotCount: 5 });
    });

    it('should make player and item names use nicknames if available', () => {
        const target = {
            typeId: 'minecraft:test_target', 
            getComponent: vi.fn().mockReturnValue({ 
                container: { 
                    size: 5,
                    getItem: vi.fn().mockReturnValue({
                        typeId: 'minecraft:test_item',
                        amount: 1,
                        nameTag: 'Test Item',
                        getComponent: vi.fn().mockReturnValue({
                            damage: 10,
                            maxDurability: 20,
                            getEnchantments: () => []
                        })
                    })
                }
            })
        };
        const player = {
            typeId: 'minecraft:player',
            name: 'TestPlayer',
            sendMessage: vi.fn()
        }
        const ui = new InventoryUI(target);
        const forceShowSpy = vi.spyOn(Utils, 'forceShow');
        ui.show(player);
        expect(forceShowSpy).toHaveBeenCalledWith(player, { slotCount: 5 });
    });

    it('should deal with items that have no components', () => {
        const target = {
            typeId: 'minecraft:test_target', 
            getComponent: vi.fn().mockReturnValue({ 
                container: { 
                    size: 5,
                    getItem: vi.fn().mockReturnValue({
                        typeId: 'minecraft:test_item',
                        amount: 1,
                        getComponent: () => void 0
                    })
                }
            })
        };
        const player = {
            typeId: 'minecraft:player',
            sendMessage: vi.fn()
        }
        const ui = new InventoryUI(target);
        const forceShowSpy = vi.spyOn(Utils, 'forceShow');
        ui.show(player);
        expect(forceShowSpy).toHaveBeenCalledWith(player, { slotCount: 5 });
    });

    it('should throw an error if the target does not have an inventory', () => {
        const target = { typeId: 'minecraft:test_target', getComponent: () => void 0 };
        const ui = new InventoryUI(target);
        expect(() => ui.show({})).toThrow('[Canopy] No inventory component found for the target entity.');
    });

    it('should throw an error if the target is undefined', () => {
        const target = { typeId: 'minecraft:test_target', getComponent: () => { throw new Error('unloaded') } };
        const ui = new InventoryUI(target);
        expect(() => ui.show({})).toThrow('[Canopy] Failed to get inventory component. The entity may be unloaded or removed.');
    });
});