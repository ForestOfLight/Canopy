/* eslint-disable max-classes-per-file */
import { vi } from 'vitest';

let nextRunId = 1;
const scheduled = new Map();
let currentTick = 0;

export function advanceTicks(n = 1) {
    for (let i = 0; i < n; i++) {
        currentTick++;
        system.currentTick = currentTick;
        for (const [id, entry] of [...scheduled.entries()]) {
            if (!scheduled.has(id)) continue;
            if (entry.nextTick <= currentTick) {
                entry.callback();
                if (entry.interval === null)
                    scheduled.delete(id);
                else if (scheduled.has(id))
                    entry.nextTick = currentTick + entry.interval;
            }
        }
    }
}

export function resetScheduler() {
    nextRunId = 1;
    scheduled.clear();
    currentTick = 0;
    system.currentTick = 0;
}

export const world = {
    beforeEvents: {
        chatSend: { subscribe: vi.fn(), unsubscribe: vi.fn() },
        playerPlaceBlock: { subscribe: vi.fn(), unsubscribe: vi.fn() },
        playerBreakBlock: { subscribe: vi.fn(), unsubscribe: vi.fn() },
        entityRemove: { subscribe: vi.fn(), unsubscribe: vi.fn() },
        playerLeave: { subscribe: vi.fn(), unsubscribe: vi.fn() },
        explosion: { subscribe: vi.fn(), unsubscribe: vi.fn() },
        playerInteractWithBlock: { subscribe: vi.fn(), unsubscribe: vi.fn() },
        playerInteractWithEntity: { subscribe: vi.fn(), unsubscribe: vi.fn() },
    },
    afterEvents: {
        worldLoad: { subscribe: vi.fn(), unsubscribe: vi.fn() },
        entitySpawn: { subscribe: vi.fn(), unsubscribe: vi.fn() },
        entityRemove: { subscribe: vi.fn(), unsubscribe: vi.fn() },
        entityDie: { subscribe: vi.fn(), unsubscribe: vi.fn() },
        entityHitEntity: { subscribe: vi.fn(), unsubscribe: vi.fn() },
        entityHurt: { subscribe: vi.fn(), unsubscribe: vi.fn() },
        entityLoad: { subscribe: vi.fn(), unsubscribe: vi.fn() },
        effectAdd: { subscribe: vi.fn(), unsubscribe: vi.fn() },
        playerInventoryItemChange: { subscribe: vi.fn(), unsubscribe: vi.fn() },
        pistonActivate: { subscribe: vi.fn(), unsubscribe: vi.fn() },
        playerBreakBlock: { subscribe: vi.fn(), unsubscribe: vi.fn() },
        playerDimensionChange: { subscribe: vi.fn(), unsubscribe: vi.fn() },
        playerGameModeChange: { subscribe: vi.fn(), unsubscribe: vi.fn() },
        playerInteractWithBlock: { subscribe: vi.fn(), unsubscribe: vi.fn() },
        playerInteractWithEntity: { subscribe: vi.fn(), unsubscribe: vi.fn() },
        playerJoin: { subscribe: vi.fn(), unsubscribe: vi.fn() },
        playerLeave: { subscribe: vi.fn(), unsubscribe: vi.fn() },
        playerPlaceBlock: { subscribe: vi.fn(), unsubscribe: vi.fn() },
        pressurePlatePush: { subscribe: vi.fn(), unsubscribe: vi.fn() },
        projectileHitEntity: { subscribe: vi.fn(), unsubscribe: vi.fn() },
    },
    getAllPlayers: vi.fn(() => []),
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
        shutdown: { subscribe: vi.fn(), unsubscribe: vi.fn() },
    },
    afterEvents: {
        scriptEventReceive: { subscribe: vi.fn(), unsubscribe: vi.fn() },
        playerPlaceBlock: { subscribe: vi.fn() },
    },
    runJob: vi.fn(),
    run: vi.fn(callback => {
        const id = nextRunId++;
        scheduled.set(id, { callback, nextTick: currentTick + 1, interval: null });
        return id;
    }),
    runInterval: vi.fn((callback, tickInterval = 0) => {
        const id = nextRunId++;
        const interval = Math.max(tickInterval, 1);
        scheduled.set(id, { callback, nextTick: currentTick + interval, interval });
        return id;
    }),
    runTimeout: vi.fn((callback, tickDelay = 0) => {
        const id = nextRunId++;
        scheduled.set(id, { callback, nextTick: currentTick + Math.max(tickDelay, 1), interval: null });
        return id;
    }),
    clearRun: vi.fn(runId => {
        scheduled.delete(runId);
    }),
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

export const DimensionTypes = { getAll: () => [], get: () => undefined };
export const ScriptEventSource = {};
export const InputButton = {};
export const ButtonState = {};
export const TicksPerSecond = 20;
export const ItemStack = {};
export const Direction = { Down: 'Down', Up: 'Up', North: 'North', South: 'South', East: 'East', West: 'West' };
export const GameMode = { survival: 'survival', creative: 'creative', adventure: 'adventure', spectator: 'spectator' };
export const EntityInitializationCause = {};
export const LiquidType = { Water: 'Water', Lava: 'Lava' };
export const StructureMirrorAxis = { None: 'None', X: 'X', Z: 'Z', XZ: 'XZ' };
export const StructureRotation = { None: 'None', Rotate90: 'Rotate90', Rotate180: 'Rotate180', Rotate270: 'Rotate270' };
export const StructureSaveMode = { Memory: 'Memory', World: 'World' };
export const CommandError = class CommandError extends Error {};
export class BlockPermutation {
    static resolve = vi.fn();
}
export class Container {}
export class Block {}
export class Entity {}
export class Player {
    sendMessage = vi.fn();
}
