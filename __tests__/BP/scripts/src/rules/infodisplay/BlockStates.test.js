import { BlockStates } from '../../../../../../Canopy [BP]/scripts/src/rules/infodisplay/BlockStates';
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
    },
    LiquidType: {
        Water: 'Water'
    }
}));

vi.mock("@minecraft/server-ui", () => ({
    ModalFormData: vi.fn()
}));

const mockPlayer = {
    getBlockFromViewDirection: vi.fn(() => ({
        block: {
            typeId: 'minecraft:stone',
            location: { x: 1, y: 2, z: 3 },
            permutation: {
                getAllStates: vi.fn(() => ({
                    state1: 'value1',
                    state2: 'value2'
                }))
            },
            canContainLiquid: vi.fn(() => false),
        }
    })),
    getEntitiesFromViewDirection: vi.fn(() => [])
};

describe('BlockStates', () => {
    let blockStates;
    beforeAll(() => {
        blockStates = new BlockStates(mockPlayer, 0);
    });

    it('should inherit from InfoDisplayElement', () => {
        expect(blockStates).toBeInstanceOf(InfoDisplayElement);
    });

    it('should create a new InfoDisplay rule', () => {
        expect(Rules.get(blockStates.identifier)).toBeDefined();
    });

    it('should have a method to return formatted block states', () => {
        expect(blockStates.getFormattedDataOwnLine()).toEqual({
            text: `§7state1: §3value1\n§7state2: §3value2`
        });
    });

    it('should show isWaterlogged state if applicable', () => {
        mockPlayer.getBlockFromViewDirection.mockReturnValueOnce({
            block: {
                typeId: 'minecraft:water',
                isWaterlogged: true,
                permutation: {
                    getAllStates: vi.fn(() => ({}))
                },
                canContainLiquid: vi.fn(() => true)
            }
        });
        expect(blockStates.getFormattedDataOwnLine()).toEqual({
            text: `§7isWaterlogged: §3true`
        });
    });
});