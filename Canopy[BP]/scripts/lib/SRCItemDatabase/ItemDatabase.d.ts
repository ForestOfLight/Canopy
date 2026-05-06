/**
 * Author: @gameza_src on Discord
 * ItemStack Database for Minecraft Bedrock Edition
 * @version 1.4.0
 * @module SRCItemDatabase
 * @description This module is used for saving and getting an 
 * ItemStack in a Minecraft world using the world structure manager.
 */
import {
    ItemStack,
    StructureSaveMode,
    Dimension,
    Vector3
} from "@minecraft/server";

/**
 * This class is used for creating an AsyncQueue
 * @version 1.2.0
 * @class
 * @classdesc AsyncQueue allows for enqueuing and processing tasks asynchronously
 * @example const aQueue = new AsyncQueue();
 * aQueue.enqueue(() => console.log('Hello World'));
 */
declare class AsyncQueue {
    queue: Function[];
    processing: boolean;
    constructor();
    /**
    * 
    * This method is used to enqueue an action
    * @param {Function} callback The callback to enqueue
    * @returns {void}
    * @example SRCItemDatabase.enqueue(() => console.log('Hello World'))
    */
    enqueue(callback: Function): void;
    /**
     * 
     * This method is used to dequeue an action
     * @returns {Promise<void>}
     * @example SRCItemDatabase.dequeue()
     * @remarks This method is called internally
     */
    dequeue(): Promise<void>;
}
/**
 * This class is used for saving or getting an ItemStack from the database
 * @version 1.4.0
 * @class
 * @classdesc SRCItemDatabase allows for saving and retrieving ItemStacks in a Minecraft world using the world structure manager.
 * @remarks The default save mode is StructureSaveMode.World, and table name most be no more than 12 characters
 * @example let IManager;
 * world.afterEvents.worldInitialize.subscribe(() => system.runTimeout(() => IManager = new ItemManager('myTable'), 200));
 * IManager.save('1239483', new ItemStack('minecraft:stone', 64));
 * 
 * @example let IManager;
 * world.afterEvents.worldInitialize.subscribe(() => system.runTimeout(() => IManager = new ItemManager('myTable', StructureSaveMode.Memory), 200));
 * IManager.save('1239483', new ItemStack('minecraft:stone', 64));
 * IManager.get('1239483').typeId;
 */
declare class SRCItemDatabase {
    /**
    * The name of the Table of this instance
    */
    table: string;
    /**
    * The save mode of this instance
    */
    saveMode: StructureSaveMode;
    /**
    * The global AsyncQueue used for queuing tasks
    */
    asyncQueue: AsyncQueue;
    /**
     * The location to save the itemStack
     */
    static location: Vector3;
    /**
     * The dimension used to save the itemStack
     */
    static dimension: Dimension;
    /**
     * 
     * @param {String} table The name of the Table to save the itemStack
     * @param {StructureSaveMode} saveMode The mode of saving: StructureSaveMode.World or StructureSaveMode.Memory
     * @example new SRCItemDatabase('myTable', StructureSaveMode.Memory);
     * @remarks The default save mode is StructureSaveMode.World
     * @remarks The save mode determines where the itemStack is saved in context of the Structure save mode
     */
    constructor(table: string, saveMode?: StructureSaveMode);
    /**
    * The init method to initialize the instance
    */
    init(): Promise<void>;
    /**
     * 
     * This method is used to load the zone where the itemStacks are saved
     * @returns {Promise<void>}
     */
    loadZone(): Promise<void>;
    /**
     * This method is used to load the itemStacks saved in the world
     * @returns {Promise<void>}
     */
    load(): Promise<void>;
    /**
     * This method is used to get an itemStack from memory 
     * @param {String} key The key of the itemStack
     * @returns {ItemStack} The itemStack from memory if it exists
     */
    get(key: string): ItemStack | undefined;
    /**
     * This method is used to save an itemStack
     * @param {String} key The key of the itemStack
     * @param {ItemStack} itemStack The itemStack to save
     * @returns {Boolean} True if the itemStack was saved successfully
     * @remarks The key most not be more than 12 characters
     */
    set(key: string, itemStack: ItemStack): Promise<boolean>;
    /**
     * This method is used to save many itemStacks
     * @param {Array<{ key: String, item: ItemStack }>} items The items to save in the world
     * @returns {Boolean} True if the itemStacks were saved successfully
     */
    setMany(items: { key: string, item: ItemStack }[]): boolean[];
    /**
     * This method is used to get an itemStack
     * @param {String} key The key of the itemStack
     * @returns {ItemStack} The itemStack
     */
    getAsync(key: string): ItemStack | undefined;
    /**
     * 
     * This method is for getting an itemStack only once, then it will be deleted
     * @param {String} key The key of the itemStack to get
     * @returns {Promise<ItemStack>} The itemStack
     */
    getOnce(key: string): ItemStack | undefined;
    /**
     * This method is used to get many itemStacks from the world
     * @param {Array<String>} keys The keys of the itemStacks
     * @returns {ItemStack[]} Array of itemStacks
     */
    getManyAsync(keys: string[]): ItemStack[];
    /**
     * This method is used to get many itemStacks from the memory
     * @param {Array<String>} keys The keys of the itemStacks
     * @returns {ItemStack[]} Array of itemStacks
     */
    getMany(keys: string[]): ItemStack[];
    /**
     * This method is used to delete an itemStack
     * @param {String} key The key of the itemStack to delete
     * @returns {Boolean} True if the itemStack was deleted successfully
     */
    delete(key: string): boolean;
    /**
     * This method is used to delete many itemStacks
     * @param {Array<String>} keys The keys of the itemStacks to delete
     * @returns {void}
     */
    deleteMany(keys: string[]): void;
    /**
     * This method is used to delete all itemStacks saved in the world
     * @returns {Boolean} True if all itemStacks were deleted successfully
     */
    clear(): boolean;
    /**
     * This method is used to check if an itemStack exists in the memory
     * @param {String} key The key of the itemStack to check
     * @returns {Boolean} True if the itemStack exists in the memory
     */
    has(key: string): boolean;
    /**
     * This method is used to check if an itemStack exists
     * @param {String} key The key of the itemStack
     * @returns {Boolean} True if the itemStack exists
     */
    hasAsync(key: string): boolean;
    /**
     * This method is used to get all itemStack ids saved in the world
     * @returns {String[]} All itemStack ids saved in the world
     */
    getAllKeys(): string[];
    /**
     * This method is used to get all itemStacks saved in the memory
     * @returns {ItemStack[]} All itemStacks saved in the memory
     * Returns all the items from the table
     */
    getAll(): ItemStack[];
    /**
     * This method is used to get all itemStacks saved in the memory asynchronously
     * @returns {ItemStack[]} All itemStacks saved in the memory
     * Returns all the items from the table
     */
    getAllAsync(): ItemStack[];
    /**
     * 
     * This method is used to save an many itemStacks in a single key
     * @param {String} key 
     * @param {ItemStack[]} items 
     * @returns {void}
     * @example iManager.setItems('myItems', [new ItemStack('minecraft:stone', 64), new ItemStack('minecraft:diamond', 32)])
     * @remarks This method may have errors.
     */
    setItems(key: string, items: ItemStack[]): void;
    /**
     * 
     * This method is used to get many itemStacks saved in a single key
     * @param {String} key The key of the itemStacks 
     * @returns {ItemStack[]} The itemStacks
     * @example iManager.getItems('myItems')
     * @remarks This method may have errors.
     */
    getItems(key: string): ItemStack[];
}
export default SRCItemDatabase;