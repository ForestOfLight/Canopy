import { world } from "@minecraft/server";
import Database from "./Database";

class DatabaseManager {
    constructor() {
        /**
         * @returns {Database} structure ids database
         * @remarks Is used to store structure ids
         */
        this.structureIds = new Database('structureIds');
    }
}
/**
 * Database manager
 * @module DatabaseManager
 * @version 1.0.0
 * @example
 * Databases.config.get('key')
 */
export let Databases;
world.afterEvents.worldLoad.subscribe(() => {
    Databases = new DatabaseManager();
});