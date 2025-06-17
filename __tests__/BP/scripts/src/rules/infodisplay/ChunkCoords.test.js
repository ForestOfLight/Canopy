import { ChunkCoords } from '../../../../../../Canopy [BP]/scripts/src/rules/infodisplay/ChunkCoords';
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { InfoDisplayElement } from '../../../../../../Canopy [BP]/scripts/src/rules/infodisplay/InfoDisplayElement';
import { Rules } from '../../../../../../Canopy [BP]/scripts/lib/canopy/Rules';

vi.mock('@minecraft/server', () => ({
    world: { 
        beforeEvents: {
            chatSend: {
                subscribe: vi.fn()
            }
        },
        afterEvents: {
            worldLoad: {
                subscribe: (callback) => {
                    callback();
                }
            }
        },
        setDynamicProperty: vi.fn()
    },
    system: {
        afterEvents: {
            scriptEventReceive: {
                subscribe: vi.fn()
            }
        },
        runJob: vi.fn()
    }
}));

vi.mock("@minecraft/server-ui", () => ({
    ModalFormData: vi.fn()
}));

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

    it('should inherit from InfoDisplayElement', () => {
        expect(chunkCoords).toBeInstanceOf(InfoDisplayElement);
    });

    it('should create a new InfoDisplay rule', () => {
        expect(Rules.get(chunkCoords.identifier)).toBeDefined();
    });

    it('should have a method to return formatted chunk coordinates', () => {
        expect(chunkCoords.getFormattedDataOwnLine()).toEqual({
            translate: 'rules.infoDisplay.chunkCoords.display', 
            with: [
                `3 2 15`,
                `2 4 -2`
            ]
        });
    });
});