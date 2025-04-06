import {
    BlockVolume,
    EntityItemComponent,
    StructureSaveMode,
    world
} from "@minecraft/server";
import { Vector } from '../Vector.js';
import { Databases } from "./DBManager.js";

class AsyncQueue {
    constructor() {
        this.queue = [];
        this.processing = false;
    }
    enqueue(callback) {
        this.queue.push(callback);
        if (!this.processing) {
            this.dequeue();
        }
    }
    async dequeue() {
        if (this.processing || this.queue.length === 0) return;
        this.processing = true;
        const task = this.queue.shift();
        try {
            await task();
        } catch (e) {
            console.error('Error processing task:', e);
        } finally {
            this.processing = false;
            if (this.queue.length > 0) this.dequeue();
        }
    } 
}
let globalAsyncQueue, itemMemory
world.afterEvents.worldLoad.subscribe(() => {
    globalAsyncQueue = new AsyncQueue(), itemMemory = new Map();
});
class SRCItemDatabase {
    constructor(table, saveMode = StructureSaveMode.World) {
        SRCItemDatabase.dimension = world.getDimension('overworld');
        this.table = table + '_item:';
        this.saveMode = saveMode;
        this.asyncQueue = globalAsyncQueue;
        this.init();
    }
    static location = new Vector(1000000, -50, 1000000);
    async init() {
        const table = this.table.split('_')[0];
        if (table.length > 12)
            throw new Error(`Initialization Error for table: "${table}": The provided table name can't be more than 12 characters. Length: ${table.length}.`);
        await this.load();
    }
    async loadZone() {
        const loc = SRCItemDatabase.location,
            min = { x: loc.x - 1, y: loc.y - 1, z: loc.z - 1 }, max = { x: loc.x + 1, y: loc.y + 1, z: loc.z + 1 },
            airMin = { x: loc.x, y: loc.y, z: loc.z }, airMax = { x: loc.x, y: loc.y + 2, z: loc.z },
            volume = new BlockVolume(min, max), volume2 = new BlockVolume(airMin, airMax);
        SRCItemDatabase.dimension.runCommand(`tickingarea add circle ${loc.x} ${loc.y} ${loc.z} 2 "idb" true`);
        SRCItemDatabase.dimension.fillBlocks(volume, 'minecraft:bedrock', { ignoreChunkBoundErrors: true });
        SRCItemDatabase.dimension.fillBlocks(volume2, 'minecraft:air', { ignoreChunkBoundErrors: true });
    };
    async load() {
        await this.loadZone();
        await this.asyncQueue.enqueue(async () => {
            const keys = this.getAllKeys();
            if (keys.length === 0) return;
            for (const key of keys) {
                const item = this.getAsync(key);
                if (item) itemMemory.set(this.table + key, item);
            }
        });
    }
    get(key) {
        const item = itemMemory.get(this.table + key);
        return item ? item : undefined;
    };
    async set(key, itemStack) {
        if (key.length > 12)
            throw new Error(`The provided key "${key}" exceeds the maximum allowed length of 12 characters (actual length: ${key.length}).`);
        let success = false;
        this.asyncQueue.enqueue(() => {
            const newId = this.table + key, existingStructure = world.structureManager.get(newId), location = SRCItemDatabase.location;
            if (existingStructure) {
                world.structureManager.delete(newId);
                itemMemory.delete(newId)
                const structureIds = Array.from(Databases.structureIds.get(this.table) ?? []);
                Databases.structureIds.set(this.table, structureIds.filter(id => id !== newId));
            };
            const newItem = SRCItemDatabase.dimension.spawnItem(itemStack, { x: location.x + 0.5, y: location.y, z: location.z + 0.5 });
            world.structureManager.createFromWorld(newId, SRCItemDatabase.dimension, location, location, {
                includeEntities: true,
                includeBlocks: false,
                saveMode: this.saveMode
            });
            itemMemory.set(newId, newItem.getComponent(EntityItemComponent.componentId).itemStack);
            newItem.remove();
            const structureIds = Array.from(Databases.structureIds.get(this.table) ?? []);
            structureIds.push(newId);
            Databases.structureIds.set(this.table, structureIds);
            success = true;
        });
        return success;
    };
    setMany(items) { return items.map(item => this.set(item.key, item.item)) };
    getAsync(key) {
        const newId = this.table + key, location = SRCItemDatabase.location, structure = world.structureManager.get(newId);
        if (!structure) return undefined;
        SRCItemDatabase.dimension.getEntities({ type: 'minecraft:item', location: location, maxDistance: 3 }).forEach(item => item.remove());
        world.structureManager.place(newId, SRCItemDatabase.dimension, location, { includeBlocks: false, includeEntities: true });
        const item = SRCItemDatabase.dimension.getEntities({ closest: 1, type: 'minecraft:item', location: location, maxDistance: 3 })[0];
        if (!item) return undefined;
        const itemStack = item.getComponent(EntityItemComponent.componentId).itemStack;
        item.remove();
        return itemStack;
    };
    getOnce(key) {
        const item = this.get(key);
        this.delete(key);
        return item;
    };
    getManyAsync(keys) { return keys.map(key => this.getAsync(key)) };
    getMany(keys) { return keys.map(key => this.get(key)) };
    delete(key) {
        itemMemory.delete(this.table + key);
        Databases.structureIds.set(this.table, Array.from(Databases.structureIds.get(this.table) ?? []).filter(id => id !== this.table + key));
        return world.structureManager.delete(this.table + key);
    };
    deleteMany(keys) { return keys.forEach(key => this.delete(key)) };
    clear() {
        this.getAllKeys().forEach(key => this.delete(key));
        return true;
    };
    has(key) { return itemMemory.has(this.table + key) };
    hasAsync(key) { return Boolean(world.structureManager.get(this.table + key)) };
    getAllKeys() { return Array.from(Databases.structureIds.get(this.table) ?? []).map(key => key.split(':')[1]) };
    getAll() { return this.getAllKeys().map(key => this.get(key)) };
    getAllAsync() { return this.getAllKeys().map(key => this.getAsync(key)) };
    setItems(key, items) {
        if (key.length > 12)
            throw new Error(`The provided key "${key}" exceeds the maximum allowed length of 12 characters (actual length: ${key.length}).`);
        let success = false;
        return this.asyncQueue.enqueue(() => {
            const newId = this.table + key, existingStructure = world.structureManager.get(newId);
            if (existingStructure) {
                world.structureManager.delete(newId);
                itemMemory.delete(newId);
                Databases.structureIds.set(this.table, Array.from(Databases.structureIds.get(this.table) ?? []).filter(id => id !== newId));
            }
            const location = SRCItemDatabase.location;
            SRCItemDatabase.dimension.getEntities({ type: 'minecraft:item', location, maxDistance: 3 }).forEach(item => item.remove())
            for (const item of items) 
                SRCItemDatabase.dimension.spawnItem(item, { x: location.x + 0.5, y: location.y, z: location.z + 0.5 });
            world.structureManager.createFromWorld(newId, SRCItemDatabase.dimension, location, location, {
                includeEntities: true,
                includeBlocks: false,
                saveMode: this.saveMode
            });
            itemMemory.set(newId, items);
            Databases.structureIds.set(this.table, Array.from(Databases.structureIds.get(this.table) ?? []).push(newId));
            success = true;
            return success;
        });
    }
    getItems(key) {
        if (key.length > 12)
            throw new Error(`The provided key "${key}" exceeds the maximum allowed length of 12 characters (actual length: ${key.length}).`);
        const newId = this.table + key, location = SRCItemDatabase.location;
        if (!itemMemory.get(newId)) return [];
        if (!world.structureManager.get(newId)) return [];
        SRCItemDatabase.dimension.getEntities({ type: 'minecraft:item', location, maxDistance: 3 }).forEach(item => item.remove())
        world.structureManager.place(newId, SRCItemDatabase.dimension, location, { includeBlocks: false, includeEntities: true });
        const items = SRCItemDatabase.dimension.getEntities({ type: 'minecraft:item', location: location, maxDistance: 3 });
        if (items.length === 0) return undefined;
        const itemStacksArray = [];
        for (const item of items) {
            itemStacksArray.push(item.getComponent(EntityItemComponent.componentId).itemStack);
            item.remove();
        }
        itemMemory.set(newId, itemStacksArray)
        return itemStacksArray;
    };
    static clearStorage() {
        const keys = Array.from(Databases.structureIds.get(this.table) ?? []);
        keys.forEach(key => world.structureManager.delete(key) && itemMemory.delete(key));
        return keys.length;
    }
}
export default SRCItemDatabase;