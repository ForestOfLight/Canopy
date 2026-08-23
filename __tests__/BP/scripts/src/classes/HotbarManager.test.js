import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EntityComponentTypes, world } from '@minecraft/server';
import { HotbarManager } from '../../../../../Canopy[BP]/scripts/src/classes/HotbarManager';
import { HotbarView } from '../../../../../Canopy[BP]/scripts/src/classes/HotbarView';

describe('HotbarManager', () => {
    const playerId = '-4294967295';
    let player;
    let container;
    let slots;
    let dynamicProperties;
    let hotbarManager;

    const makeContainer = (size = 36) => {
        slots = new Array(size).fill(void 0);
        return {
            size,
            getItem: vi.fn(index => slots[index]),
            setItem: vi.fn((index, itemStack) => {
                slots[index] = itemStack;
            })
        };
    };

    beforeEach(() => {
        vi.clearAllMocks();
        world.tickingAreaManager = {
            createTickingArea: vi.fn(() => Promise.resolve()),
            removeTickingArea: vi.fn(),
            hasTickingArea: vi.fn(() => true)
        };
        container = makeContainer();
        dynamicProperties = {};
        player = {
            id: playerId,
            getComponent: vi.fn(type => (type === EntityComponentTypes.Inventory ? { container } : void 0)),
            getDynamicProperty: vi.fn(key => dynamicProperties[key]),
            setDynamicProperty: vi.fn((key, value) => {
                dynamicProperties[key] = value;
            })
        };
        hotbarManager = new HotbarManager(player);
    });

    afterEach(() => {
        delete world.tickingAreaManager;
    });

    describe('buildHotbarKey', () => {
        it('namespaces the key with the player id and hotbar index', () => {
            expect(HotbarManager.buildHotbarKey(playerId, 3)).toBe('canopy:hotbar--4294967295-3');
        });
    });

    describe('saveHotbar', () => {
        it('saves the hotbar under the last loaded hotbar index', () => {
            dynamicProperties.lastLoadedHotbar = 4;
            const spy = vi.spyOn(hotbarManager.itemDatabase, 'saveContainer').mockImplementation(() => void 0);

            hotbarManager.saveHotbar();

            expect(spy).toHaveBeenCalledWith(HotbarManager.buildHotbarKey(playerId, 4), expect.any(HotbarView));
        });

        it('saves only the nine hotbar slots', () => {
            const spy = vi.spyOn(hotbarManager.itemDatabase, 'saveContainer').mockImplementation(() => void 0);

            hotbarManager.saveHotbar();

            const [, savedContainer] = spy.mock.calls[0];
            expect(savedContainer.size).toBe(9);
        });

        it('exposes the hotbar items through the saved container', () => {
            const stick = { typeId: 'minecraft:stick', amount: 1 };
            slots[2] = stick;
            const spy = vi.spyOn(hotbarManager.itemDatabase, 'saveContainer').mockImplementation(() => void 0);

            hotbarManager.saveHotbar();

            const [, savedContainer] = spy.mock.calls[0];
            expect(savedContainer.getItem(2)).toBe(stick);
        });

        it('writes a single structure rather than one per slot', () => {
            const spy = vi.spyOn(hotbarManager.itemDatabase, 'saveContainer').mockImplementation(() => void 0);
            hotbarManager.saveHotbar();
            expect(spy).toHaveBeenCalledTimes(1);
        });

        it('does not save when the inventory component is absent', () => {
            player.getComponent.mockReturnValue(void 0);
            const spy = vi.spyOn(hotbarManager.itemDatabase, 'saveContainer').mockImplementation(() => void 0);
            hotbarManager.saveHotbar();
            expect(spy).not.toHaveBeenCalled();
        });
    });

    describe('loadHotbar', () => {
        it('loads the hotbar under the requested index', () => {
            const spy = vi.spyOn(hotbarManager.itemDatabase, 'loadContainer').mockImplementation(() => void 0);

            hotbarManager.loadHotbar(2);

            expect(spy).toHaveBeenCalledWith(HotbarManager.buildHotbarKey(playerId, 2), expect.any(HotbarView));
        });

        it('applies loaded items to the hotbar', () => {
            const stick = { typeId: 'minecraft:stick', amount: 1 };
            vi.spyOn(hotbarManager.itemDatabase, 'loadContainer').mockImplementation((key, hotbar) => {
                hotbar.setItem(5, stick);
            });

            hotbarManager.loadHotbar(1);

            expect(slots[5]).toBe(stick);
        });

        it('empties the hotbar when nothing was saved under the index', () => {
            slots.fill({ typeId: 'minecraft:stick', amount: 1 });
            vi.spyOn(hotbarManager.itemDatabase, 'loadContainer').mockImplementation(() => void 0);

            hotbarManager.loadHotbar(1);

            expect(slots.slice(0, 9).every(slot => slot === void 0)).toBe(true);
        });

        it('leaves the rest of the inventory untouched', () => {
            const stick = { typeId: 'minecraft:stick', amount: 1 };
            slots.fill(stick);
            vi.spyOn(hotbarManager.itemDatabase, 'loadContainer').mockImplementation(() => void 0);

            hotbarManager.loadHotbar(1);

            expect(slots.slice(9).every(slot => slot === stick)).toBe(true);
        });

        it('records the loaded hotbar index', () => {
            vi.spyOn(hotbarManager.itemDatabase, 'loadContainer').mockImplementation(() => void 0);

            hotbarManager.loadHotbar(6);

            expect(hotbarManager.getLastLoadedHotbar()).toBe(6);
        });

        it('does not load when the inventory component is absent', () => {
            player.getComponent.mockReturnValue(void 0);
            const spy = vi.spyOn(hotbarManager.itemDatabase, 'loadContainer').mockImplementation(() => void 0);
            hotbarManager.loadHotbar(1);
            expect(spy).not.toHaveBeenCalled();
        });
    });

    describe('getLastLoadedHotbar', () => {
        it('defaults to the first hotbar', () => {
            expect(hotbarManager.getLastLoadedHotbar()).toBe(0);
        });

        it('returns the stored index', () => {
            hotbarManager.setLastLoadedHotbar(7);
            expect(hotbarManager.getLastLoadedHotbar()).toBe(7);
        });
    });
});
