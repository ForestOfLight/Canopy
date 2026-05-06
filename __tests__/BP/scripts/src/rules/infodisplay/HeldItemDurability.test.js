import { HeldItemDurability } from '../../../../../../Canopy[BP]/scripts/src/rules/infodisplay/HeldItemDurability';
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { InfoDisplayTextElement } from '../../../../../../Canopy[BP]/scripts/src/rules/infodisplay/InfoDisplayTextElement';
import { Rules } from '../../../../../../Canopy[BP]/scripts/lib/canopy/rules/Rules';
import { ItemComponentTypes, Player } from '@minecraft/server';

const mockDurabilityComponent = {
    maxDurability: 250,
    damage: 0,
};

const mockItemStack = {
    getComponent: vi.fn(),
};

const mockEquippableComponent = {
    getEquipment: vi.fn(),
};

const mockPlayer = new Player();
vi.spyOn(mockPlayer, 'getComponent').mockImplementation((type) => type === 'equippable' ? mockEquippableComponent : undefined);

describe('HeldItemDurability', () => {
    let heldItemDurability;
    beforeAll(() => {
        heldItemDurability = new HeldItemDurability(mockPlayer, 0);
    });
    beforeEach(() => {
        mockDurabilityComponent.damage = 0;
        mockDurabilityComponent.maxDurability = 250;
        mockItemStack.getComponent.mockImplementation((type) =>
            type === ItemComponentTypes.Durability ? mockDurabilityComponent : undefined
        );
        mockEquippableComponent.getEquipment.mockReturnValue(mockItemStack);
        mockPlayer.getComponent.mockReturnValue(mockEquippableComponent);
    });

    it('should inherit from InfoDisplayTextElement', () => {
        expect(heldItemDurability).toBeInstanceOf(InfoDisplayTextElement);
    });

    it('should create a new InfoDisplay rule', () => {
        expect(Rules.get(heldItemDurability.identifier)).toBeDefined();
    });

    it('should return empty text when no item is held', () => {
        mockEquippableComponent.getEquipment.mockReturnValueOnce(undefined);
        expect(heldItemDurability.getFormattedDataOwnLine()).toEqual({ text: '' });
    });

    it('should return empty text when held item has no durability component', () => {
        mockItemStack.getComponent.mockReturnValueOnce(undefined);
        expect(heldItemDurability.getFormattedDataOwnLine()).toEqual({ text: '' });
    });

    it('should show green remaining for high durability (>=50%)', () => {
        mockDurabilityComponent.damage = 0;
        expect(heldItemDurability.getFormattedDataOwnLine()).toEqual({
            translate: 'rules.infoDisplay.heldItemDurability.display',
            with: ['§a250§7/§a250§r']
        });
    });

    it('should show yellow remaining for mid durability (10-49%)', () => {
        mockDurabilityComponent.damage = 175;
        expect(heldItemDurability.getFormattedDataOwnLine()).toEqual({
            translate: 'rules.infoDisplay.heldItemDurability.display',
            with: ['§e75§7/§a250§r']
        });
    });

    it('should show red remaining for low durability (<10%)', () => {
        mockDurabilityComponent.damage = 232;
        expect(heldItemDurability.getFormattedDataOwnLine()).toEqual({
            translate: 'rules.infoDisplay.heldItemDurability.display',
            with: ['§c18§7/§a250§r']
        });
    });

    it('should return same data for shared line as own line', () => {
        expect(heldItemDurability.getFormattedDataSharedLine()).toEqual(
            heldItemDurability.getFormattedDataOwnLine()
        );
    });
});
