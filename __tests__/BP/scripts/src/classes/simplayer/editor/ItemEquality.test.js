import { describe, it, expect, vi } from 'vitest';
import { ItemComponentTypes } from '@minecraft/server';
import { ItemEquality } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/editor/ItemEquality';

// Extend ItemComponentTypes with additional component types for testing
ItemComponentTypes.Book = 'book';
ItemComponentTypes.Potion = 'potion';
ItemComponentTypes.Dyeable = 'dyeable';
ItemComponentTypes.Inventory = 'inventory';

const makeStackable = ({ typeId = 'minecraft:dirt', amount = 1, stacksWith = true } = {}) => ({
    typeId,
    amount,
    isStackable: true,
    nameTag: void 0,
    isStackableWith: vi.fn(() => stacksWith),
    getComponent: vi.fn(() => void 0)
});

const makeTool = ({
    typeId = 'minecraft:diamond_sword',
    nameTag = void 0,
    damage = void 0,
    enchantments = void 0,
    book = void 0,
    potion = void 0,
    dyeable = void 0,
    inventory = void 0
} = {}) => ({
    typeId,
    amount: 1,
    isStackable: false,
    nameTag,
    isStackableWith: vi.fn(() => false),
    getComponent: vi.fn(componentId => {
        if (componentId === ItemComponentTypes.Durability && damage !== void 0)
            return { damage };
        if (componentId === ItemComponentTypes.Enchantable && enchantments !== void 0)
            return { getEnchantments: () => enchantments };
        if (componentId === ItemComponentTypes.Book && book !== void 0)
            return book;
        if (componentId === ItemComponentTypes.Potion && potion !== void 0)
            return potion;
        if (componentId === ItemComponentTypes.Dyeable && dyeable !== void 0)
            return dyeable;
        if (componentId === ItemComponentTypes.Inventory && inventory !== void 0)
            return inventory;
        return void 0;
    })
});

describe('ItemEquality', () => {
    describe('undefined handling', () => {
        it('treats two empty slots as equal', () => {
            expect(ItemEquality.equal(void 0, void 0)).toBe(true);
        });

        it('treats an empty slot and an item as unequal', () => {
            expect(ItemEquality.equal(void 0, makeStackable())).toBe(false);
            expect(ItemEquality.equal(makeStackable(), void 0)).toBe(false);
        });
    });

    describe('stackable items', () => {
        it('is equal when isStackableWith passes and amounts match', () => {
            const a = makeStackable({ amount: 8 });
            const b = makeStackable({ amount: 8 });
            expect(ItemEquality.equal(a, b)).toBe(true);
            expect(a.isStackableWith).toHaveBeenCalledWith(b);
        });

        it('is unequal when amounts differ', () => {
            expect(ItemEquality.equal(makeStackable({ amount: 8 }), makeStackable({ amount: 16 }))).toBe(false);
        });

        it('is unequal when isStackableWith rejects', () => {
            const a = makeStackable({ stacksWith: false });
            expect(ItemEquality.equal(a, makeStackable())).toBe(false);
        });
    });

    describe('non-stackable items', () => {
        it('treats a tool as equal to an identical clone', () => {
            expect(ItemEquality.equal(makeTool(), makeTool())).toBe(true);
        });

        it('is unequal when typeId differs', () => {
            expect(ItemEquality.equal(makeTool(), makeTool({ typeId: 'minecraft:iron_sword' }))).toBe(false);
        });

        it('is unequal when nameTag differs', () => {
            expect(ItemEquality.equal(makeTool({ nameTag: 'Stabby' }), makeTool())).toBe(false);
        });

        it('is unequal when durability damage differs', () => {
            expect(ItemEquality.equal(makeTool({ damage: 3 }), makeTool({ damage: 9 }))).toBe(false);
        });

        it('is unequal when only one has a durability component', () => {
            expect(ItemEquality.equal(makeTool({ damage: 3 }), makeTool())).toBe(false);
        });

        it('is unequal when enchantment levels differ', () => {
            const sharp3 = [{ type: { id: 'sharpness' }, level: 3 }];
            const sharp4 = [{ type: { id: 'sharpness' }, level: 4 }];
            expect(ItemEquality.equal(makeTool({ enchantments: sharp3 }), makeTool({ enchantments: sharp4 }))).toBe(false);
        });

        it('ignores enchantment ordering', () => {
            const forward = [{ type: { id: 'sharpness' }, level: 3 }, { type: { id: 'unbreaking' }, level: 2 }];
            const reversed = [{ type: { id: 'unbreaking' }, level: 2 }, { type: { id: 'sharpness' }, level: 3 }];
            expect(ItemEquality.equal(makeTool({ enchantments: forward }), makeTool({ enchantments: reversed }))).toBe(true);
        });

        it('is unequal when book contents differ', () => {
            const book1 = { author: 'Alice', contents: ['Hello'], isSigned: true, pageCount: 1 };
            const book2 = { author: 'Alice', contents: ['World'], isSigned: true, pageCount: 1 };
            expect(ItemEquality.equal(makeTool({ book: book1 }), makeTool({ book: book2 }))).toBe(false);
        });

        it('is equal when neither has a book component', () => {
            expect(ItemEquality.equal(makeTool(), makeTool())).toBe(true);
        });

        it('is unequal when potion types differ', () => {
            const potion1 = { potionEffectType: 'fire_resistance', potionDeliveryType: 'drinkable' };
            const potion2 = { potionEffectType: 'slowness', potionDeliveryType: 'drinkable' };
            expect(ItemEquality.equal(makeTool({ potion: potion1 }), makeTool({ potion: potion2 }))).toBe(false);
        });

        it('is equal when neither has a potion component', () => {
            expect(ItemEquality.equal(makeTool(), makeTool())).toBe(true);
        });

        it('is unequal when dye colors differ', () => {
            const color1 = { red: 255, green: 0, blue: 0 };
            const color2 = { red: 0, green: 255, blue: 0 };
            expect(ItemEquality.equal(makeTool({ dyeable: { color: color1 } }), makeTool({ dyeable: { color: color2 } }))).toBe(false);
        });

        it('is equal when neither has a dyeable component', () => {
            expect(ItemEquality.equal(makeTool(), makeTool())).toBe(true);
        });

        it('is unequal when inventory contents differ', () => {
            const inventory1 = { container: { size: 2, getItem: vi.fn((i) => i === 0 ? { typeId: 'minecraft:dirt', amount: 1 } : void 0) } };
            const inventory2 = { container: { size: 2, getItem: vi.fn((i) => i === 0 ? { typeId: 'minecraft:stone', amount: 1 } : void 0) } };
            expect(ItemEquality.equal(makeTool({ inventory: inventory1 }), makeTool({ inventory: inventory2 }))).toBe(false);
        });

        it('is equal when neither has an inventory component', () => {
            expect(ItemEquality.equal(makeTool(), makeTool())).toBe(true);
        });
    });

    describe('mixed stackability', () => {
        it('is unequal when one item is stackable and the other is not', () => {
            expect(ItemEquality.equal(makeStackable(), makeTool())).toBe(false);
        });
    });
});
