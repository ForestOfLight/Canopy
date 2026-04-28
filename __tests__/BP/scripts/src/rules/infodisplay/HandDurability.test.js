import { HandDurability } from '../../../../../../Canopy[BP]/scripts/src/rules/infodisplay/HandDurability';
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

describe('HandDurability', () => {
    let handDurability;
    beforeAll(() => {
        handDurability = new HandDurability(mockPlayer, 0);
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
        expect(handDurability).toBeInstanceOf(InfoDisplayTextElement);
    });

    it('should create a new InfoDisplay rule', () => {
        expect(Rules.get(handDurability.identifier)).toBeDefined();
    });

    it('should return empty text when no item is held', () => {
        mockEquippableComponent.getEquipment.mockReturnValueOnce(undefined);
        expect(handDurability.getFormattedDataOwnLine()).toEqual({ text: '' });
    });

    it('should return empty text when held item has no durability component', () => {
        mockItemStack.getComponent.mockReturnValueOnce(undefined);
        expect(handDurability.getFormattedDataOwnLine()).toEqual({ text: '' });
    });

    it('should show green remaining for high durability (>=50%)', () => {
        mockDurabilityComponent.damage = 0;
        expect(handDurability.getFormattedDataOwnLine()).toEqual({
            translate: 'rules.infoDisplay.handDurability.display',
            with: ['§a250§7/§a250§r']
        });
    });

    it('should show yellow remaining for mid durability (10-49%)', () => {
        mockDurabilityComponent.damage = 175;
        expect(handDurability.getFormattedDataOwnLine()).toEqual({
            translate: 'rules.infoDisplay.handDurability.display',
            with: ['§e75§7/§a250§r']
        });
    });

    it('should show red remaining for low durability (<10%)', () => {
        mockDurabilityComponent.damage = 232;
        expect(handDurability.getFormattedDataOwnLine()).toEqual({
            translate: 'rules.infoDisplay.handDurability.display',
            with: ['§c18§7/§a250§r']
        });
    });

    it('should return same data for shared line as own line', () => {
        expect(handDurability.getFormattedDataSharedLine()).toEqual(
            handDurability.getFormattedDataOwnLine()
        );
    });
});
