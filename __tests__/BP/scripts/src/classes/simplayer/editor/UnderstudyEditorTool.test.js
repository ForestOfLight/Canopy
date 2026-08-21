import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EntityComponentTypes, ItemStack, Player } from '@minecraft/server';
import { UnderstudyEditorTool } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/editor/UnderstudyEditorTool';

describe('UnderstudyEditorTool', () => {
    let player;

    const hold = (typeId, slotIndex = 0) => {
        const container = player.getComponent(EntityComponentTypes.Inventory).container;
        container.setItem(slotIndex, new ItemStack(typeId, 1));
        player.selectedSlotIndex = slotIndex;
    };

    beforeEach(() => {
        vi.restoreAllMocks();
        player = new Player();
        player.id = 'player-1';
    });

    it('accepts a spyglass in the selected slot', () => {
        hold('minecraft:spyglass');

        expect(UnderstudyEditorTool.isHeldBy(player)).toBe(true);
    });

    it('accepts an arrow in the selected slot', () => {
        hold('minecraft:arrow');

        expect(UnderstudyEditorTool.isHeldBy(player)).toBe(true);
    });

    it('rejects a tipped arrow', () => {
        hold('minecraft:tipped_arrow');

        expect(UnderstudyEditorTool.isHeldBy(player)).toBe(false);
    });

    it('rejects a spectral arrow', () => {
        hold('minecraft:spectral_arrow');

        expect(UnderstudyEditorTool.isHeldBy(player)).toBe(false);
    });

    it('rejects an unrelated item', () => {
        hold('minecraft:diamond_sword');

        expect(UnderstudyEditorTool.isHeldBy(player)).toBe(false);
    });

    it('rejects an empty hand', () => {
        player.selectedSlotIndex = 0;

        expect(UnderstudyEditorTool.isHeldBy(player)).toBe(false);
    });

    it('reads the selected slot rather than the first slot', () => {
        hold('minecraft:diamond_sword', 0);
        hold('minecraft:spyglass', 4);

        expect(UnderstudyEditorTool.isHeldBy(player)).toBe(true);
    });

    it('rejects a player whose inventory cannot be read', () => {
        player.getComponent.mockImplementation(() => {
            throw new Error('invalid entity');
        });

        expect(UnderstudyEditorTool.isHeldBy(player)).toBe(false);
    });

    it('rejects a missing player', () => {
        expect(UnderstudyEditorTool.isHeldBy(void 0)).toBe(false);
    });
});
