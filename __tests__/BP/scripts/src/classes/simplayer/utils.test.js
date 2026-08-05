import { beforeEach, describe, it, expect, vi } from 'vitest';
import { Block, Entity, Player, world } from '@minecraft/server';
import { getLookAtLocation, getLookAtRotation, swapSlots, portOldGameModeToNewUpdate, getLocationInfoFromSource } from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/utils.js';

vi.mock('@minecraft/server', async () => await import('@forestoflight/minecraft-vitest-mocks/server'));

const PLAYER_EYE_HEIGHT = 1.62001002;

beforeEach(() => {
    vi.clearAllMocks();
});

describe('getLookAtLocation', () => {
    it('returns a location offset from base using rotation', () => {
        const base = { x: 0, y: 0, z: 0 };
        const rotation = { x: 0, y: 0 };
        const result = getLookAtLocation(base, rotation);
        expect(result).toHaveProperty('x');
        expect(result).toHaveProperty('y');
        expect(result).toHaveProperty('z');
    });

    it('adds PLAYER_EYE_HEIGHT to y when pitch is 0', () => {
        const base = { x: 0, y: 0, z: 0 };
        const result = getLookAtLocation(base, { x: 0, y: 0 });
        expect(result.y).toBeCloseTo(PLAYER_EYE_HEIGHT);
    });

    it('looks south (positive z) when yaw is 0', () => {
        const base = { x: 0, y: 0, z: 0 };
        const result = getLookAtLocation(base, { x: 0, y: 0 });
        expect(result.z).toBeCloseTo(1000);
        expect(result.x).toBeCloseTo(0);
    });

    it('looks west (negative x) when yaw is 90', () => {
        const base = { x: 0, y: 0, z: 0 };
        const result = getLookAtLocation(base, { x: 0, y: 90 });
        expect(result.x).toBeCloseTo(-1000);
        expect(result.z).toBeCloseTo(0);
    });

    it('looks north (negative z) when yaw is 180', () => {
        const base = { x: 0, y: 0, z: 0 };
        const result = getLookAtLocation(base, { x: 0, y: 180 });
        expect(result.z).toBeCloseTo(-1000);
        expect(result.x).toBeCloseTo(0);
    });

    it('looks east (positive x) when yaw is -90', () => {
        const base = { x: 0, y: 0, z: 0 };
        const result = getLookAtLocation(base, { x: 0, y: -90 });
        expect(result.x).toBeCloseTo(1000);
        expect(result.z).toBeCloseTo(0);
    });

    it('points straight up when pitch is -90', () => {
        const base = { x: 0, y: 0, z: 0 };
        const result = getLookAtLocation(base, { x: -90, y: 0 });
        expect(result.y).toBeCloseTo(1000 + PLAYER_EYE_HEIGHT);
        expect(result.x).toBeCloseTo(0);
        expect(result.z).toBeCloseTo(0);
    });

    it('points straight down when pitch is 90', () => {
        const base = { x: 0, y: 0, z: 0 };
        const result = getLookAtLocation(base, { x: 90, y: 0 });
        expect(result.y).toBeCloseTo(-1000 + PLAYER_EYE_HEIGHT);
    });

    it('offsets from base location', () => {
        const base = { x: 10, y: 5, z: 20 };
        const result = getLookAtLocation(base, { x: 0, y: 0 });
        expect(result.x).toBeCloseTo(10);
        expect(result.y).toBeCloseTo(5 + PLAYER_EYE_HEIGHT);
        expect(result.z).toBeCloseTo(1020);
    });
});

describe('getLookAtRotation', () => {
    it('returns pitch and yaw from base to target', () => {
        const base = { x: 0, y: 0, z: 0 };
        const target = { x: 0, y: PLAYER_EYE_HEIGHT, z: 1 };
        const result = getLookAtRotation(base, target);
        expect(result).toHaveProperty('x');
        expect(result).toHaveProperty('y');
        expect(typeof result.x).toBe('number');
        expect(typeof result.y).toBe('number');
    });

    it('returns pitch ~0 when target is at eye height directly south', () => {
        const base = { x: 0, y: 0, z: 0 };
        const result = getLookAtRotation(base, { x: 0, y: PLAYER_EYE_HEIGHT, z: 1 });
        expect(result.x).toBeCloseTo(0);
    });

    it('returns pitch ~0 when target is at eye height directly north', () => {
        const base = { x: 0, y: 0, z: 0 };
        const result = getLookAtRotation(base, { x: 0, y: PLAYER_EYE_HEIGHT, z: -1 });
        expect(result.x).toBeCloseTo(0);
    });

    it('returns pitch ~0 when target is at eye height directly east', () => {
        const base = { x: 0, y: 0, z: 0 };
        const result = getLookAtRotation(base, { x: 1, y: PLAYER_EYE_HEIGHT, z: 0 });
        expect(result.x).toBeCloseTo(0);
    });

    it('returns pitch ~0 when target is at eye height directly west', () => {
        const base = { x: 0, y: 0, z: 0 };
        const result = getLookAtRotation(base, { x: -1, y: PLAYER_EYE_HEIGHT, z: 0 });
        expect(result.x).toBeCloseTo(0);
    });

    it('returns pitch -90 when looking straight up', () => {
        const base = { x: 0, y: 0, z: 0 };
        const result = getLookAtRotation(base, { x: 0, y: PLAYER_EYE_HEIGHT + 1000, z: 0 });
        expect(result.x).toBeCloseTo(-90);
    });

    it('returns pitch 90 when looking straight down', () => {
        const base = { x: 0, y: 0, z: 0 };
        const result = getLookAtRotation(base, { x: 0, y: PLAYER_EYE_HEIGHT - 1000, z: 0 });
        expect(result.x).toBeCloseTo(90);
    });
});

describe('swapSlots', () => {
    it('swaps items between two slots', () => {
        const item0 = { typeId: 'minecraft:apple' };
        const item1 = { typeId: 'minecraft:stone' };
        const container = {
            getItem: vi.fn(i => i === 0 ? item0 : item1),
            setItem: vi.fn()
        };
        swapSlots(container, 0, 1);
        expect(container.setItem).toHaveBeenCalledWith(0, item1);
        expect(container.setItem).toHaveBeenCalledWith(1, item0);
    });

    it('swaps when one slot is empty', () => {
        const item0 = { typeId: 'minecraft:apple' };
        const container = {
            getItem: vi.fn(i => i === 0 ? item0 : undefined),
            setItem: vi.fn()
        };
        swapSlots(container, 0, 1);
        expect(container.setItem).toHaveBeenCalledWith(0, undefined);
        expect(container.setItem).toHaveBeenCalledWith(1, item0);
    });

    it('throws when container is null', () => {
        expect(() => swapSlots(null, 0, 1)).toThrow();
    });

    it('throws when container is undefined', () => {
        expect(() => swapSlots(undefined, 0, 1)).toThrow();
    });
});

describe('portOldGameModeToNewUpdate', () => {
    it('converts string game modes to GameMode enum values', () => {
        expect(portOldGameModeToNewUpdate('survival')).toBe('Survival');
        expect(portOldGameModeToNewUpdate('creative')).toBe('Creative');
        expect(portOldGameModeToNewUpdate('adventure')).toBe('Adventure');
        expect(portOldGameModeToNewUpdate('spectator')).toBe('Spectator');
    });

    it('handles uppercase game mode strings', () => {
        expect(portOldGameModeToNewUpdate('Survival')).toBe('Survival');
        expect(portOldGameModeToNewUpdate('Creative')).toBe('Creative');
        expect(portOldGameModeToNewUpdate('Adventure')).toBe('Adventure');
        expect(portOldGameModeToNewUpdate('Spectator')).toBe('Spectator');
    });

    it('throws on unknown game mode string', () => {
        expect(() => portOldGameModeToNewUpdate('unknown')).toThrow();
    });

    it('throws when gameMode is not a string', () => {
        expect(() => portOldGameModeToNewUpdate(0)).toThrow();
    });

    it('throws when gameMode is null', () => {
        expect(() => portOldGameModeToNewUpdate(null)).toThrow();
    });
});

describe('getLocationInfoFromSource', () => {
    it('throws for invalid source', () => {
        expect(() => getLocationInfoFromSource({})).toThrow();
    });

    it('throws for null source', () => {
        expect(() => getLocationInfoFromSource(null)).toThrow();
    });

    it('returns location, dimension, rotation, and gameMode for a Player source', () => {
        const player = new Player();
        player.location = { x: 1, y: 64, z: 1 };
        player.dimension = world.getDimension();
        player.getRotation.mockReturnValue({ x: 0, y: 90 });
        player.getGameMode.mockReturnValue('Survival');
        const result = getLocationInfoFromSource(player);
        expect(result.location).toEqual(player.location);
        expect(result.dimension).toBe(player.dimension);
        expect(result.rotation).toEqual({ x: 0, y: 90 });
        expect(result.gameMode).toBe('Survival');
    });

    it('returns location, dimension, and rotation for an Entity source', () => {
        const entity = new Entity();
        entity.location = { x: 5, y: 70, z: 5 };
        entity.dimension = world.getDimension();
        entity.getRotation.mockReturnValue({ x: 10, y: 45 });
        const result = getLocationInfoFromSource(entity);
        expect(result.location).toEqual(entity.location);
        expect(result.dimension).toBe(entity.dimension);
        expect(result.rotation).toEqual({ x: 10, y: 45 });
        expect(result.gameMode).toBeUndefined();
    });

    it('returns offset location and dimension for a Block source', () => {
        const block = new Block();
        block.x = 5;
        block.y = 63;
        block.z = 5;
        block.dimension = world.getDimension();
        const result = getLocationInfoFromSource(block);
        expect(result.location).toEqual({ x: 5.5, y: 64, z: 5.5 });
        expect(result.dimension).toBe(block.dimension);
    });
});
