import { describe, it, expect, beforeEach } from 'vitest';
import { Container } from '@minecraft/server';
import { PeekView, PeekViewMode } from '../../../../../../Canopy[BP]/scripts/src/classes/peek/PeekView';

const makeItem = typeId => ({ typeId, amount: 1 });

describe('PeekView', () => {
    describe('view mode selection', () => {
        it('shows the top half when the player is not sneaking', () => {
            expect(PeekView.viewModeFor(false)).toBe(PeekViewMode.Top);
        });

        it('shows the bottom half while the player sneaks', () => {
            expect(PeekView.viewModeFor(true)).toBe(PeekViewMode.Bottom);
        });

        it('stays on the top half for a container that fits in one page', () => {
            const view = new PeekView(new Container({ size: 27 }), PeekViewMode.Bottom);
            expect(view.viewMode).toBe(PeekViewMode.Top);
        });

        it('only pages containers larger than one chest', () => {
            expect(PeekView.isPaged(new Container({ size: 54 }))).toBe(true);
            expect(PeekView.isPaged(new Container({ size: 27 }))).toBe(false);
            expect(PeekView.isPaged(new Container({ size: 5 }))).toBe(false);
            expect(PeekView.isPaged(void 0)).toBe(false);
        });
    });

    describe('a double chest', () => {
        let container;
        const topView = () => new PeekView(container, PeekViewMode.Top);
        const bottomView = () => new PeekView(container, PeekViewMode.Bottom);

        beforeEach(() => {
            container = new Container({ size: 54 });
        });

        it('splits into two 27 slot halves', () => {
            expect(topView().size).toBe(27);
            expect(bottomView().size).toBe(27);
        });

        it('reads the first 27 slots as the top half', () => {
            container.setItem(0, makeItem('minecraft:dirt'));
            container.setItem(26, makeItem('minecraft:stone'));
            expect(topView().getItem(0).typeId).toBe('minecraft:dirt');
            expect(topView().getItem(26).typeId).toBe('minecraft:stone');
        });

        it('reads the last 27 slots as the bottom half', () => {
            container.setItem(27, makeItem('minecraft:emerald'));
            container.setItem(53, makeItem('minecraft:diamond'));
            expect(bottomView().getItem(0).typeId).toBe('minecraft:emerald');
            expect(bottomView().getItem(26).typeId).toBe('minecraft:diamond');
        });

        it('writes the bottom half back to the real slots behind it', () => {
            bottomView().setItem(0, makeItem('minecraft:gold_ingot'));
            expect(container.getItem(27).typeId).toBe('minecraft:gold_ingot');
            expect(container.getItem(0)).toBeUndefined();
        });

        it('writes the top half to the low slots', () => {
            topView().setItem(0, makeItem('minecraft:gold_ingot'));
            expect(container.getItem(0).typeId).toBe('minecraft:gold_ingot');
        });

        it('claims exactly its own page of slots', () => {
            expect(topView().hasSlot(26)).toBe(true);
            expect(topView().hasSlot(27)).toBe(false);
            expect(bottomView().hasSlot(26)).toBe(true);
            expect(bottomView().hasSlot(27)).toBe(false);
            expect(topView().hasSlot(-1)).toBe(false);
        });
    });

    describe('a partial second page', () => {
        it('sizes the bottom half to whatever is left over', () => {
            const container = new Container({ size: 36 });
            expect(new PeekView(container, PeekViewMode.Bottom).size).toBe(9);
        });

        it('reads the leftover slots', () => {
            const container = new Container({ size: 36 });
            container.setItem(35, makeItem('minecraft:bone'));
            expect(new PeekView(container, PeekViewMode.Bottom).getItem(8).typeId).toBe('minecraft:bone');
        });
    });

    describe('a small container', () => {
        it('shows every slot on the top page', () => {
            const container = new Container({ size: 5 });
            container.setItem(4, makeItem('minecraft:redstone'));
            const view = new PeekView(container, PeekViewMode.Top);
            expect(view.size).toBe(5);
            expect(view.getItem(4).typeId).toBe('minecraft:redstone');
        });
    });

    describe('titleKeyFor', () => {
        it('names each half', () => {
            expect(PeekView.titleKeyFor(PeekViewMode.Top)).toBe('commands.peek.view.top');
            expect(PeekView.titleKeyFor(PeekViewMode.Bottom)).toBe('commands.peek.view.bottom');
        });
    });
});
