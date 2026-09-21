import { ItemStack, Player, world } from "@minecraft/server";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { QuickFillClipboard } from "../../../../../../Canopy[BP]/scripts/src/classes/quickfill/QuickFillClipboard";

const databaseState = vi.hoisted(() => ({
    containers: new Map()
}));

vi.mock("../../../../../../Canopy[BP]/scripts/lib/EntityItemDatabase/EntityItemDatabase", () => ({
    EntityItemDatabase: class {
        static MAX_CONTAINER_SIZE = 54;

        saveContainer(key, container) {
            const items = new Array(container.size);
            for (let slot = 0; slot < container.size; slot++)
                items[slot] = container.getItem(slot)?.clone();
            databaseState.containers.set(key, items);
        }

        loadContainer(key, container) {
            const items = databaseState.containers.get(key);
            if (!items)
                return false;

            for (let slot = 0; slot < Math.min(container.size, items.length); slot++)
                container.setItem(slot, items[slot]?.clone());

            return true;
        }

        deleteContainer(key) {
            return databaseState.containers.delete(key);
        }
    }
}));

import { QuickFillPresetStore } from "../../../../../../Canopy[BP]/scripts/src/classes/quickfill/QuickFillPresetStore";

function createPlayer() {
    const properties = new Map();
    const player = new Player();

    player.getDynamicProperty.mockImplementation(key => properties.get(key));
    player.setDynamicProperty.mockImplementation((key, value) => {
        if (value === void 0)
            properties.delete(key);
        else
            properties.set(key, value);
    });

    return player;
}

function createClipboard(typeId = 'minecraft:stone', amount = 17) {
    const slots = new Array(5);
    slots[0] = new ItemStack(typeId, amount);
    slots[4] = new ItemStack('minecraft:dirt');

    return new QuickFillClipboard({
        shape: 'generic:5',
        slots
    });
}

describe('QuickFillPresetStore', () => {
    let worldProperties;

    beforeEach(() => {
        databaseState.containers.clear();
        worldProperties = new Map();

        world.getDynamicProperty = vi.fn(key => worldProperties.get(key));
        world.setDynamicProperty = vi.fn((key, value) => {
            if (value === void 0)
                worldProperties.delete(key);
            else
                worldProperties.set(key, value);
        });
    });

    test('saves and loads a literal clipboard with shape and slot count', () => {
        const player = createPlayer();
        const clipboard = createClipboard();

        expect(QuickFillPresetStore.save(player, 'rockets', clipboard)).toBe(true);
        expect(QuickFillPresetStore.getNames(player)).toEqual(['rockets']);

        const loaded = QuickFillPresetStore.load(player, 'rockets');

        expect(loaded).toBeInstanceOf(QuickFillClipboard);
        expect(loaded.shape).toBe('generic:5');
        expect(loaded.getSlotCount()).toBe(5);
        expect(loaded.slots[0].typeId).toBe('minecraft:stone');
        expect(loaded.slots[0].amount).toBe(17);
        expect(loaded.slots[1]).toBeUndefined();
        expect(loaded.slots[4].typeId).toBe('minecraft:dirt');
    });

    test('overwriting a named preset keeps its storage identity and replaces its clipboard', () => {
        const player = createPlayer();

        QuickFillPresetStore.save(player, 'filters', createClipboard('minecraft:stone'));
        const [firstStorageKey] = databaseState.containers.keys();

        QuickFillPresetStore.save(player, 'filters', createClipboard('minecraft:deepslate', 32));
        const [secondStorageKey] = databaseState.containers.keys();
        const loaded = QuickFillPresetStore.load(player, 'filters');

        expect(QuickFillPresetStore.getNames(player)).toEqual(['filters']);
        expect(databaseState.containers.size).toBe(1);
        expect(secondStorageKey).toBe(firstStorageKey);
        expect(loaded.slots[0].typeId).toBe('minecraft:deepslate');
        expect(loaded.slots[0].amount).toBe(32);
    });

    test('stores presets independently per player', () => {
        const firstPlayer = createPlayer();
        const secondPlayer = createPlayer();

        QuickFillPresetStore.save(firstPlayer, 'layout', createClipboard('minecraft:stone'));
        QuickFillPresetStore.save(secondPlayer, 'layout', createClipboard('minecraft:dirt'));

        expect(QuickFillPresetStore.load(firstPlayer, 'layout').slots[0].typeId).toBe('minecraft:stone');
        expect(QuickFillPresetStore.load(secondPlayer, 'layout').slots[0].typeId).toBe('minecraft:dirt');

        const storageKeys = [...databaseState.containers.keys()];
        expect(storageKeys).toHaveLength(2);
        expect(storageKeys[0]).not.toBe(storageKeys[1]);
    });

    test('lists preset names in saved order', () => {
        const player = createPlayer();

        QuickFillPresetStore.save(player, 'rockets', createClipboard());
        QuickFillPresetStore.save(player, 'filters', createClipboard());
        QuickFillPresetStore.save(player, 'furnace', createClipboard());

        expect(QuickFillPresetStore.getNames(player)).toEqual([
            'rockets',
            'filters',
            'furnace'
        ]);
    });

    test('deletes a named preset and its stored clipboard', () => {
        const player = createPlayer();

        QuickFillPresetStore.save(player, 'rockets', createClipboard());
        const [storageKey] = databaseState.containers.keys();

        expect(databaseState.containers.has(storageKey)).toBe(true);
        expect(QuickFillPresetStore.delete(player, 'rockets')).toBe(true);

        expect(QuickFillPresetStore.getNames(player)).toEqual([]);
        expect(databaseState.containers.has(storageKey)).toBe(false);
    });

    test('returns false when deleting a preset that does not exist', () => {
        const player = createPlayer();

        expect(QuickFillPresetStore.delete(player, 'missing')).toBe(false);
    });
});
