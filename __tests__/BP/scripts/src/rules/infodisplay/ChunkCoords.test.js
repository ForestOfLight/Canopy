import { ChunkCoords } from '../../../../../../Canopy[BP]/scripts/src/rules/infodisplay/ChunkCoords';
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { Rules } from '../../../../../../Canopy[BP]/scripts/lib/canopy/rules/Rules';
import { InfoDisplayTextElement } from '../../../../../../Canopy[BP]/scripts/src/rules/infodisplay/InfoDisplayTextElement';

vi.mock('@minecraft/server', async (importOriginal) => {
    const original = await importOriginal();
    return {
        ...original,
        world: {
            ...original.world,
            afterEvents: {
                ...original.world.afterEvents,
                worldLoad: { subscribe: (callback) => callback() }
            }
        }
    };
});

const mockPlayer = {
    location: {
        x: 35.5,
        y: 66.0,
        z: -16.75
    }
};

describe('BlockStates', () => {
    let chunkCoords;
    beforeAll(() => {
        chunkCoords = new ChunkCoords(mockPlayer, 0);
    });

    it('should inherit from InfoDisplayTextElement', () => {
        expect(chunkCoords).toBeInstanceOf(InfoDisplayTextElement);
    });

    it('should create a new InfoDisplay rule', () => {
        expect(Rules.get(chunkCoords.identifier)).toBeDefined();
    });

    it('should have a method to return formatted chunk coordinates', () => {
        expect(chunkCoords.getFormattedDataOwnLine()).toEqual({
            translate: 'rules.infoDisplay.chunkCoords.display', 
            with: [
                "§d03 02 15",
                "§l§d2 4 -2",
            ]
        });
    });
});
