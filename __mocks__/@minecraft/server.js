/* eslint-disable max-classes-per-file */
// Support both Vitest (vi.fn()) and plain Node.js (noOp) contexts
let mockFn;
try {
    const vitest = await import('vitest');
    mockFn = vitest.vi.fn;
} catch {
    mockFn = () => () => {};
}

const noOp = () => {};
const fn = () => mockFn();
const eventEmitter = () => ({ subscribe: fn(), unsubscribe: fn() });

// Returns an event emitter for any property access, so unknown events don't throw
const eventBus = () => new Proxy({}, { get: () => eventEmitter() });

export const world = {
    beforeEvents: eventBus(),
    afterEvents: eventBus(),
    getDimension: fn(),
    getDynamicProperty: fn(),
    setDynamicProperty: fn(),
    getPlayers: () => [],
    getAllPlayers: () => [],
    structureManager: {
        place: fn(),
    },
};

export const system = {
    currentTick: 0,
    beforeEvents: eventBus(),
    afterEvents: eventBus(),
    runJob: fn(),
    run: fn(),
    runInterval: fn(),
    runTimeout: fn(),
    clearRun: fn(),
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
export const GameMode = { survival: 'survival', creative: 'creative', adventure: 'adventure', spectator: 'spectator' };
export const Direction = { down: 'down', up: 'up', north: 'north', south: 'south', east: 'east', west: 'west' };
export const LiquidType = {};
export const FluidType = {};
export const EquipmentSlot = {};
export const BlockPistonState = {};
export const BlockComponentTypes = {};
export const StructureMirrorAxis = {};
export const StructureRotation = {};
export const StructureSaveMode = {};
export const RawMessage = {};
export const MolangVariableMap = {};
export const EntityInitializationCause = {};
export const TicksPerSecond = 20;
export const ItemStack = {};
export class Block {}
export class BlockPermutation {}
export class BlockVolume {}
export class Container {}
export class CommandError extends Error {}
export class Entity {}
export class EntityItemComponent {}
export class Player {
    sendMessage = fn();
}
