import { PeekInventory } from '../../../../../../Canopy [BP]/scripts/src/rules/infodisplay/PeekInventory';
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
        beforeEvents: {
            startup: {
                subscribe: vi.fn()
            }
        },
        afterEvents: {
            scriptEventReceive: {
                subscribe: vi.fn()
            }
        },
        runJob: vi.fn()
    },
    ItemStack: vi.fn((typeId, amount) => ({
        typeId: typeId,
        amount: amount || 1,
        localizationKey: `item.${typeId.replace("minecraft:", '')}.name`
    })),
    CommandPermissionLevel: {
        Any: 'Any'
    },
    CustomCommandParamType: {
        String: 'String'
    },
    CustomCommandStatus: {
        Failure: 'Failure'
    }
}));

vi.mock("@minecraft/server-ui", () => ({
    ModalFormData: vi.fn()
}));

const mockPlayer = {
    getBlockFromViewDirection: vi.fn(() => ({
        block: {
            typeId: 'minecraft:chest',
            localizationKey: 'tile.chest.name',
            getComponent: vi.fn(() => ({
                container: {
                    size: 27,
                    getItem: vi.fn((index) => {
                        if (index < 27)
                            return { typeId: 'minecraft:grass_block', amount: 1 };
                        return void 0;
                    })
                }
            }))
        }
    })),
    getEntitiesFromViewDirection: vi.fn(() => [])
};

describe('BlockStates', () => {
    let peekInventory;
    beforeAll(() => {
        peekInventory = new PeekInventory(mockPlayer, 0);
    });

    it('should inherit from InfoDisplayElement', () => {
        expect(peekInventory).toBeInstanceOf(InfoDisplayElement);
    });

    it('should create a new InfoDisplay rule', () => {
        expect(Rules.get(peekInventory.identifier)).toBeDefined();
    });

    it('should have a method to return formatted chunk coordinates', () => {
        expect(peekInventory.getFormattedDataOwnLine()).toEqual({ rawtext: [
            { text: "§r" },
            { text: "§r" },
            { translate: "item.grass_block.name" },
            { text: ": 27\n" }
        ]});
    });
});