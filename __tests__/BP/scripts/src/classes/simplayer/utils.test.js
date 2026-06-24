import { describe, it, expect, vi } from 'vitest';
import { getLookAtLocation, getLookAtRotation, swapSlots, portOldGameModeToNewUpdate, getLocationInfoFromSource } from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/utils.js';

vi.mock('@minecraft/server', async () => await import('@forestoflight/minecraft-vitest-mocks/server'));

describe('getLookAtLocation', () => {
    it('returns a location offset from base using rotation', () => {
        const base = { x: 0, y: 0, z: 0 };
        const rotation = { x: 0, y: 0 };
        const result = getLookAtLocation(base, rotation);
        expect(result).toHaveProperty('x');
        expect(result).toHaveProperty('y');
        expect(result).toHaveProperty('z');
    });
});

describe('getLookAtRotation', () => {
    it('returns pitch and yaw from base to target', () => {
        const base = { x: 0, y: 0, z: 0 };
        const target = { x: 0, y: 1.62001002, z: 1 };
        const result = getLookAtRotation(base, target);
        expect(result).toHaveProperty('x');
        expect(result).toHaveProperty('y');
        expect(typeof result.x).toBe('number');
        expect(typeof result.y).toBe('number');
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

    it('throws when container is null', () => {
        expect(() => swapSlots(null, 0, 1)).toThrow();
    });
});

describe('portOldGameModeToNewUpdate', () => {
    it('converts string game modes to GameMode enum values', () => {
        expect(portOldGameModeToNewUpdate('survival')).toBe('Survival');
        expect(portOldGameModeToNewUpdate('creative')).toBe('Creative');
        expect(portOldGameModeToNewUpdate('adventure')).toBe('Adventure');
        expect(portOldGameModeToNewUpdate('spectator')).toBe('Spectator');
    });

    it('throws on unknown game mode string', () => {
        expect(() => portOldGameModeToNewUpdate('unknown')).toThrow();
    });

    it('throws when gameMode is not a string', () => {
        expect(() => portOldGameModeToNewUpdate(0)).toThrow();
    });
});

describe('getLocationInfoFromSource', () => {
    it('throws for invalid source', () => {
        expect(() => getLocationInfoFromSource({})).toThrow();
    });
});
