/*
gameza_src (Main Developer)
Copyright 2024 all rights reserved by gameza_src. DO NOT steal, copy the code, or claim it as your own!
Please send a message to gameza_src on Discord, or join our discord server: https://discord.com/invite/tECQYc3C7E
Thank you.

*/
import { world } from "@minecraft/server";

const memory = {};
class BDatabase {
    constructor(value) {
        this.tableName = value;
        memory[this.tableName] = this.fetch() || {};
        this.QUEUE = [];
        let e = this.fetch();
        memory[this.tableName] = e, this.onLoadCallback?.(e), this.QUEUE.forEach(s => s());
    };
    resetStorage() {
        let value = world.getDynamicPropertyIds().filter(e => e.startsWith(`db_${this.tableName}`));
        for (let e of value) world.setDynamicProperty(e, void 0);
        world.setDynamicProperty(`db_${this.tableName}`, 0);
        memory[this.tableName] = {};  // Resetea la memoria para esta tabla
    };
    fetch() {
        let value = world.getDynamicProperty(`db_${this.tableName}`) ?? 0;
        if (typeof value != "number" && (console.warn(`[DATABASE]: DB: ${this.tableName}, has improper setup! Resetting data.`),/* MainSettings.logs.errors.push(`[DATABASE]: DB: ${this.tableName}, has improper setup! Resetting data.`),*/ value = 0, this.resetStorage()), value <= 0) return {};
        let e = "";
        for (let s = 0; s < value; s++) {
            let a = world.getDynamicProperty(`db_${this.tableName}_${s}`);
            if (typeof a != "string") return console.warn(`[DATABASE]: When fetching: db_${this.tableName}_${s}, improper data was found.`),  /*MainSettings.logs.errors.push(`[DATABASE]: When fetching: db_${this.tableName}_${s}, improper data was found.`),*/ this.resetStorage(), {};
            e += a;
        }
        let data = JSON.parse(e);
        memory[this.tableName] = data;  // Actualiza la memoria global
        return memory[this.tableName];
    };
    async addQueueTask() {
        return new Promise(t => {
            this.QUEUE.push(t)
        })
    };
    async saveData() {
        if (!memory[this.tableName]) await this.addQueueTask();
        let value = JSON.stringify(memory[this.tableName]).match(/.{1,8000}/g);
        if (!value) return;
        world.setDynamicProperty(`db_${this.tableName}`, value.length);
        let e = value.entries();
        for (let [s, a] of e) world.setDynamicProperty(`db_${this.tableName}_${s}`, a);
    };
    async onLoad(value) {
        if (memory[this.tableName]) return value(memory[this.tableName]);
        this.onLoadCallback = value;
    };
    getDBS(table) {
        const gsDatabases = world.getDynamicPropertyIds()
            .filter(db => db.startsWith(`${table}:`))
            .map(db2 => db2);
        return gsDatabases;
    };
    async set(value, e) {
        if (!memory[this.tableName]) throw new Error("Data tried to be set before load!");
        memory[this.tableName][value] = e;
        return this.saveData();
    };
    async setMany(data) {
        if (!memory[this.tableName]) throw new Error("Data not loaded! Consider using `setMany` after loading the data.");
        const promises = Object.keys(data).map(async (key) => {
            memory[this.tableName][key] = data[key];
            await this.set(key, data[key]);
        });
        await Promise.all(promises);
        return this;
    };
    async deleteMany(keys) {
        if (!memory[this.tableName]) throw new Error("Data not loaded! Consider using `deleteMany` after loading the data.");
        const promises = keys.map(async (key) => {
            delete memory[this.tableName][key];
            await this.delete(key);
        });
        await Promise.all(promises);
        return this;
    };
    forEach(callback) {
        const collection = this.collection();
        try {
            Object.keys(collection).forEach(key => callback(key, collection[key]));
        }
        catch (e) {
            console.warn(e + e.stack);
        }
        return this;
    };
    map(callback) {
        const then = this.collection(), now = [];
        try {
            Object.keys(then).forEach(key => now.push(callback(key, then[key]) || undefined));
        }
        catch (e) {
            console.warn(e + e.stack);
        }
        now.forEach((v, i) => {
            if (!v.length)
                return;
            const oldKey = Object.keys(then)[i];
            if (v[0] != oldKey) {
                this.delete(oldKey);
                return this.set(v[0], v[1]);
            }
            return this.set(oldKey, v[1]);
        });
        return this;
    };
    get(value) {
        if (!memory[this.tableName]) throw new Error("Data not loaded! Consider using `getAsync` instead!");
        return memory[this.tableName][value];
    };
    async getSync(value) {
        return memory[this.tableName] ? this.get(value) : (await this.addQueueTask(), memory[this.tableName] ? memory[this.tableName][value] : null);
    };
    getMany(keys) {
        return keys.map(key => this.get(key));
    };
    async getManySync(keys) {
        const values = await Promise.all(keys.map(async key => await this.getSync(key)));
        return values;
    };
    keys() {
        if (!memory[this.tableName]) throw new Error("Data not loaded! Consider using `keysSync` instead!");
        return Object.keys(memory[this.tableName]);
    };
    async keysSync() {
        return memory[this.tableName] ? this.keys() : (await this.addQueueTask(), memory[this.tableName] ? Object.keys(memory[this.tableName]) : []);
    };
    allKeysP() {
        return Object.keys(memory[this.tableName]);
    };
    async allKeys() {
        await this.addQueueTask(); // Asegurarse de que los datos estén cargados
        const allKeys = this.allKeysP();
        if (!allKeys) return;
        return allKeys.map(key => `\n${key}`);
    };
    values() {
        if (!memory[this.tableName]) throw new Error("Data not loaded! Consider using `valuesSync` instead!");
        return Object.values(memory[this.tableName]);
    };
    async valuesSync() {
        return memory[this.tableName] ? this.values() : (await this.addQueueTask(), memory[this.tableName] ? Object.values(memory[this.tableName]) : []);
    };
    has(value) {
        if (!memory[this.tableName]) throw new Error("Data not loaded! Consider using `hasSync` instead!");
        return Boolean(memory[this.tableName][value]);
    };
    async hasSync(value) {
        return memory[this.tableName] ? this.has(value) : (await this.addQueueTask(), memory[this.tableName] ? Boolean(memory[this.tableName][value]) : !1);
    };
    find(value) {
        return Object.keys(memory[this.tableName]).find(key => memory[this.tableName][key] === value);
    };
    findMany(value) {
        return Object.keys(memory[this.tableName]).filter(key => memory[this.tableName][key] === value);
    };
    collection() {
        if (!memory[this.tableName]) throw new Error("Data not loaded! Consider using `collectionSync` instead!");
        return memory[this.tableName];
    };
    async collectionSync() {
        return memory[this.tableName] ? this.collection() : (await this.addQueueTask(), memory[this.tableName] ? memory[this.tableName] : {});
    };
    async delete(value) {
        if (!memory[this.tableName]) return !1;
        let e = delete memory[this.tableName][value];
        return await this.saveData(), e;
    };
    async clear() {
        memory[this.tableName] = {};
        return await this.saveData();
    };
    getKeyByValue(value) {
        for (let e in memory[this.tableName])
            if (memory[this.tableName][e] === value) return e;
        return null;
    };
};
export default BDatabase;