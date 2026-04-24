/* eslint-disable max-classes-per-file */
import { vi } from 'vitest';

export const world = {
    beforeEvents: {
        chatSend: { subscribe: vi.fn() },
        playerPlaceBlock: { subscribe: vi.fn(), unsubscribe: vi.fn() },
        entityRemove: { subscribe: vi.fn() },
        playerLeave: { subscribe: vi.fn() },
    },
    afterEvents: {
        worldLoad: { subscribe: vi.fn() },
        entitySpawn: { subscribe: vi.fn() },
        playerInventoryItemChange: { subscribe: vi.fn(), unsubscribe: vi.fn() },
        pistonActivate: { subscribe: vi.fn() },
    },
    getDimension: vi.fn(),
    getDynamicProperty: vi.fn(),
    setDynamicProperty: vi.fn(),
    structureManager: {
        place: vi.fn(),
    },
};

export const system = {
    currentTick: 0,
    beforeEvents: {
        startup: { subscribe: vi.fn(), unsubscribe: vi.fn() },
    },
    afterEvents: {
        scriptEventReceive: { subscribe: vi.fn(), unsubscribe: vi.fn() },
        playerPlaceBlock: { subscribe: vi.fn() },
    },
    runJob: vi.fn(),
    run: vi.fn(),
    runInterval: vi.fn(),
    runTimeout: vi.fn(),
    clearRun: vi.fn(),
};

export const EntityComponentTypes = {
    Inventory: 'inventory',
};

export const ItemComponentTypes = {
    Durability: 'durability',
    Enchantable: 'enchantable',
};

export const CustomCommandSource = {
    Block: 'Block',
    Entity: 'Entity',
    Server: 'Server',
};

export const CustomCommandStatus = {
    Failure: 'Failure',
    Success: 'Success',
};

export const CustomCommandParamType = {
    Boolean: 'Boolean',
    Enum: 'Enum',
    Float: 'Float',
    Integer: 'Integer',
    Location: 'Location',
    String: 'String',
    EntitySelector: 'EntitySelector',
    EntityType: 'EntityType',
    BlockType: 'BlockType',
};

export const CommandPermissionLevel = {
    Any: 'Any',
    GameDirectors: 'GameDirectors',
    Admin: 'Admin',
    Owner: 'Owner',
    Internal: 'Internal',
};

export const DimensionTypes = {};
export const ScriptEventSource = {};
export const InputButton = {};
export const ButtonState = {};
export const TicksPerSecond = 20;
export const ItemStack = {};
export class Block {}
export class Entity {}
export class Player {
    sendMessage = vi.fn();
}
