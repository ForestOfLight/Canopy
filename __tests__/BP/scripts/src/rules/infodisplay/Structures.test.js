import { Structures } from '../../../../../../Canopy [BP]/scripts/src/rules/infodisplay/Structures';
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
        getGeneratedStructures: vi.fn(() => ["minecraft:monument", "minecraft:pillager_outpost"])
    }
};

describe('Structures', () => {
    let structures;
    beforeAll(() => {
        structures = new Structures(mockPlayer, 0);
    });

    it('should inherit from InfoDisplayElement', () => {
        expect(structures).toBeInstanceOf(InfoDisplayElement);
    });

    it('should create a new InfoDisplay rule', () => {
        expect(Rules.get(structures.identifier)).toBeDefined();
    });

    it('should have a method to return any generated structures at the player\'s location', () => {
        expect(structures.getFormattedDataOwnLine()).toEqual({
            "translate": "rules.infodisplay.structures.display",
            "with": [ "§bminecraft:monument, minecraft:pillager_outpost" ]
        });
    });

    it('should return an empty string when there are no structures found', () => {
        mockPlayer.dimension.getGeneratedStructures.mockReturnValue([]);
        expect(structures.getFormattedDataOwnLine()).toEqual({
            text: ''
        });
    });
});