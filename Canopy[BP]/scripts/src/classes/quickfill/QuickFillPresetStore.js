import { world } from "@minecraft/server";
import { EntityItemDatabase } from "../../../lib/EntityItemDatabase/EntityItemDatabase";
import { QuickFillClipboard } from "./QuickFillClipboard";

export class QuickFillPresetStore {
    static #CATALOG_PROPERTY = 'quickFillPresets';
    static #NEXT_STORAGE_ID_PROPERTY = 'quickFillPresetNextStorageId';
    static #CATALOG_VERSION = 1;
    static #STORAGE_KEY_PREFIX = 'canopy:qf_preset_';

    static save(player, name, clipboard) {
        const normalizedName = this.#normalizeName(name);
        if (!player || !normalizedName || !this.#isValidClipboard(clipboard))
            return false;

        const slotCount = clipboard.getSlotCount();
        if (slotCount > EntityItemDatabase.MAX_CONTAINER_SIZE)
            return false;

        const catalog = this.#getCatalog(player);
        const presetIndex = catalog.presets.findIndex(preset => preset.name === normalizedName);
        const existingPreset = presetIndex === -1 ? void 0 : catalog.presets[presetIndex];
        const storageId = existingPreset?.storageId ?? this.#allocateStorageId();

        const preset = {
            name: normalizedName,
            storageId,
            shape: clipboard.shape,
            slotCount,
            wildcardGroups: [...clipboard.wildcardGroups]
        };

        const database = new EntityItemDatabase();
        database.saveContainer(
            this.#getStorageKey(storageId),
            this.#getClipboardContainer(clipboard)
        );

        if (presetIndex === -1)
            catalog.presets.push(preset);
        else
            catalog.presets[presetIndex] = preset;

        this.#setCatalog(player, catalog);
        return true;
    }

    static load(player, name) {
        const preset = this.#getPreset(player, name);
        if (!preset)
            return;

        const slots = new Array(preset.slotCount);
        const writableContainer = {
            size: preset.slotCount,
            setItem: (slot, itemStack) => {
                slots[slot] = itemStack?.clone();
            }
        };

        const database = new EntityItemDatabase();
        const loaded = database.loadContainer(
            this.#getStorageKey(preset.storageId),
            writableContainer
        );

        if (!loaded)
            return;

        return new QuickFillClipboard({
            shape: preset.shape,
            slots,
            wildcardGroups: preset.wildcardGroups
        });
    }

    static delete(player, name) {
        const normalizedName = this.#normalizeName(name);
        if (!player || !normalizedName)
            return false;

        const catalog = this.#getCatalog(player);
        const presetIndex = catalog.presets.findIndex(preset => preset.name === normalizedName);

        if (presetIndex === -1)
            return false;

        const [preset] = catalog.presets.splice(presetIndex, 1);

        const database = new EntityItemDatabase();
        database.deleteContainer(this.#getStorageKey(preset.storageId));

        this.#setCatalog(player, catalog);
        return true;
    }

    static getNames(player) {
        return this.#getCatalog(player).presets.map(preset => preset.name);
    }

    static #getPreset(player, name) {
        const normalizedName = this.#normalizeName(name);
        if (!player || !normalizedName)
            return;

        return this.#getCatalog(player).presets.find(preset => preset.name === normalizedName);
    }

    static #getCatalog(player) {
        const rawCatalog = player?.getDynamicProperty(this.#CATALOG_PROPERTY);
        if (typeof rawCatalog !== 'string')
            return this.#createEmptyCatalog();

        try {
            const catalog = JSON.parse(rawCatalog);
            if (catalog?.version !== this.#CATALOG_VERSION || !Array.isArray(catalog.presets))
                return this.#createEmptyCatalog();

            return {
                ...catalog,
                presets: catalog.presets.filter(preset => this.#isValidPresetMetadata(preset))
            };
        } catch {
            return this.#createEmptyCatalog();
        }
    }

    static #setCatalog(player, catalog) {
        player.setDynamicProperty(
            this.#CATALOG_PROPERTY,
            JSON.stringify(catalog)
        );
    }

    static #createEmptyCatalog() {
        return {
            version: this.#CATALOG_VERSION,
            presets: []
        };
    }

    static #allocateStorageId() {
        const current = world.getDynamicProperty(this.#NEXT_STORAGE_ID_PROPERTY);
        const storageId = Number.isSafeInteger(current) && current > 0
            ? current
            : 1;

        world.setDynamicProperty(
            this.#NEXT_STORAGE_ID_PROPERTY,
            storageId + 1
        );

        return storageId;
    }

    static #getStorageKey(storageId) {
        return `${this.#STORAGE_KEY_PREFIX}${storageId}`;
    }

    static #getClipboardContainer(clipboard) {
        return {
            size: clipboard.getSlotCount(),
            getItem: slot => clipboard.resolveSlot(slot)
        };
    }

    static #normalizeName(name) {
        return typeof name === 'string' ? name.trim() : '';
    }

    static #isValidClipboard(clipboard) {
        if (!clipboard ||
            typeof clipboard.shape !== 'string' ||
            typeof clipboard.getSlotCount !== 'function')
            return false;

        const slotCount = clipboard.getSlotCount();
        return Number.isInteger(slotCount) && slotCount >= 0;
    }

    static #isValidPresetMetadata(preset) {
        return preset !== null &&
            typeof preset === 'object' &&
            typeof preset.name === 'string' &&
            preset.name.length > 0 &&
            Number.isSafeInteger(preset.storageId) &&
            preset.storageId > 0 &&
            typeof preset.shape === 'string' &&
            Number.isInteger(preset.slotCount) &&
            preset.slotCount >= 0 &&
            preset.slotCount <= EntityItemDatabase.MAX_CONTAINER_SIZE &&
            this.#isValidWildcardGroups(preset.wildcardGroups, preset.slotCount);
    }

    static #isValidWildcardGroups(wildcardGroups, slotCount) {
        if (wildcardGroups === void 0)
            return true;
        if (!Array.isArray(wildcardGroups) || wildcardGroups.length > slotCount)
            return false;

        return wildcardGroups.every(group =>
            group === null ||
            (Number.isSafeInteger(group) && group >= 0)
        );
    }
}
