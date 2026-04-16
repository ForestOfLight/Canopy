import { Structures } from '../../../../../../Canopy [BP]/scripts/src/rules/infodisplay/Structures';
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { InfoDisplayElement } from '../../../../../../Canopy [BP]/scripts/src/rules/infodisplay/InfoDisplayElement';
import { Rules } from '../../../../../../Canopy [BP]/scripts/lib/canopy/rules/Rules';

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
        expect(structures.getFormattedDataOwnLine()).toEqual({ rawtext: [
            { "translate": "rules.infodisplay.structures.display" },
            { text: "§dminecraft:monument, minecraft:pillager_outpost" }
        ] });
    });

    it('should return an empty string when there are no structures found', () => {
        mockPlayer.dimension.getGeneratedStructures.mockReturnValue([]);
        expect(structures.getFormattedDataOwnLine()).toEqual({ "rawtext": [
            { "translate": "rules.infodisplay.structures.display" },
            { "translate": "rules.infodisplay.structures.display.none" },
        ] });
    });
});