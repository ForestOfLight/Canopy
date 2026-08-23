import { describe, it, expect } from 'vitest';
import { ProxyLayout, layoutForTarget } from '../../../../../../Canopy[BP]/scripts/src/classes/proxy/ProxyLayout';

describe('layoutForTarget', () => {
    it('gives hoppers the real 5-slot hopper UI instead of a mostly empty chest', () => {
        expect(layoutForTarget('minecraft:hopper')).toBe(ProxyLayout.Hopper);
        expect(layoutForTarget('minecraft:hopper_minecart')).toBe(ProxyLayout.Hopper);
    });

    it('uses a chest for everything else, since larger targets are shown one page at a time', () => {
        expect(layoutForTarget('minecraft:chest')).toBe(ProxyLayout.Chest);
        expect(layoutForTarget('minecraft:furnace')).toBe(ProxyLayout.Chest);
        expect(layoutForTarget('minecraft:dispenser')).toBe(ProxyLayout.Chest);
        expect(layoutForTarget('minecraft:player')).toBe(ProxyLayout.Chest);
    });
});
