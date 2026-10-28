import { describe, it, expect } from 'vitest';
import { ItemStack } from '@minecraft/server';
import { SlotPlaceholder } from '../../../../../../Canopy[BP]/scripts/src/classes/proxy/SlotPlaceholder';

describe('SlotPlaceholder', () => {
    it('creates a barrier', () => {
        expect(SlotPlaceholder.create().typeId).toBe('minecraft:barrier');
    });

    it('recognizes barriers as placeholders', () => {
        expect(SlotPlaceholder.is(SlotPlaceholder.create())).toBe(true);
        expect(SlotPlaceholder.is(new ItemStack('minecraft:stone'))).toBe(false);
        expect(SlotPlaceholder.is(void 0)).toBe(false);
    });
});
