import { Dimension } from '../../../../../../Canopy [BP]/scripts/src/rules/infodisplay/Dimension';
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
    dimension: {
        id: 'minecraft:overworld'
    }
};

describe('BlockStates', () => {
    let dimension;
    beforeAll(() => {
        dimension = new Dimension(mockPlayer, 0);
    });

    it('should inherit from InfoDisplayElement', () => {
        expect(dimension).toBeInstanceOf(InfoDisplayElement);
    });

    it('should create a new InfoDisplay rule', () => {
        expect(Rules.get(dimension.identifier)).toBeDefined();
    });

    it('should have a method to return formatted dimensionId', () => {
        expect(dimension.getFormattedDataOwnLine()).toEqual({ text: '§aminecraft:overworld' });
    });

    it('should change the color for the nether', () => {
        mockPlayer.dimension.id = "minecraft:nether";
        expect(dimension.getFormattedDataOwnLine()).toEqual({ text: '§cminecraft:nether' });
    });

    it('should change the color for the end', () => {
        mockPlayer.dimension.id = "minecraft:the_end";
        expect(dimension.getFormattedDataOwnLine()).toEqual({ text: '§dminecraft:the_end' });
    });
});