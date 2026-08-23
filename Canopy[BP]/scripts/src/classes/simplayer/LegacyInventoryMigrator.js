import { world } from "@minecraft/server";
import { EntityItemDatabase } from "../../../lib/EntityItemDatabase/EntityItemDatabase";
import { WorkingRegion } from "../../../lib/EntityItemDatabase/WorkingRegion";
import { LegacyInventoryReader } from "./LegacyInventoryReader";
import { UnderstudyInventorySaver } from "./UnderstudyInventorySaver";

export class LegacyInventoryMigrator {
    static #PLAYER_INFO_DP_PATTERN = /^(.+):playerinfo$/;
    static #TRUNCATED_NAME_LENGTH = 8;

    static async migrate() {
        const legacyNames = LegacyInventoryReader.findSavedNames();
        if (legacyNames.size === 0)
            return 0;
        const itemDatabase = new EntityItemDatabase();
        await WorkingRegion.ready;
        const fullNames = LegacyInventoryMigrator.#mapTruncatedToFullNames();
        let migratedCount = 0;
        for (const truncatedName of legacyNames) {
            if (LegacyInventoryMigrator.#tryMigrateOne(itemDatabase, truncatedName, fullNames.get(truncatedName)))
                migratedCount++;
        }
        if (migratedCount > 0)
            console.warn(`[Canopy] Ported ${migratedCount} saved simplayer ${migratedCount === 1 ? 'inventory' : 'inventories'} to the current save format.`);
        return migratedCount;
    }

    static #tryMigrateOne(itemDatabase, truncatedName, fullName) {
        const reader = new LegacyInventoryReader(truncatedName);
        try {
            if (fullName === void 0) {
                console.warn(`[Canopy] Discarding saved simplayer inventory '${truncatedName}' because no player it could belong to is saved.`);
                reader.remove();
                return false;
            }
            const inventoryKey = UnderstudyInventorySaver.buildInventoryKey(fullName);
            if (world.structureManager.get(inventoryKey) !== void 0) {
                reader.remove();
                return false;
            }
            itemDatabase.saveContainer(inventoryKey, reader.readStorage());
            reader.remove();
            return true;
        } catch (error) {
            console.warn(`[Canopy] Could not port saved simplayer inventory '${truncatedName}'. Leaving it in place:`, error, error.stack);
            return false;
        }
    }

    static #mapTruncatedToFullNames() {
        const fullNames = new Map();
        for (const propertyId of world.getDynamicPropertyIds()) {
            const match = LegacyInventoryMigrator.#PLAYER_INFO_DP_PATTERN.exec(propertyId);
            if (match === null)
                continue;
            const fullName = match[1];
            const truncatedName = fullName.substring(0, LegacyInventoryMigrator.#TRUNCATED_NAME_LENGTH);
            if (!fullNames.has(truncatedName))
                fullNames.set(truncatedName, fullName);
        }
        return fullNames;
    }
}
