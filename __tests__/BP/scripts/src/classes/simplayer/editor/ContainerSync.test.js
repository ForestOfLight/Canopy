import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContainerSync } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/editor/ContainerSync';

const makeItem = (typeId, amount = 1) => ({
    typeId,
    amount,
    isStackable: true,
    nameTag: void 0,
    isStackableWith: other => other.typeId === typeId,
    getComponent: () => void 0,
    clone() {
        return makeItem(this.typeId, this.amount);
    }
});

const makeView = (size, items = {}) => {
    const slots = Array.from({ length: size }, (_, i) => items[i]);
    return {
        size,
        slots,
        getItem: vi.fn(i => slots[i]),
        setItem: vi.fn((i, itemStack) => {
            slots[i] = itemStack;
        })
    };
};

describe('ContainerSync', () => {
    describe('snapshot', () => {
        it('clones every slot up to the view size', () => {
            const view = makeView(3, { 1: makeItem('minecraft:dirt', 4) });
            const snapshot = ContainerSync.snapshot(view);
            expect(snapshot).toHaveLength(3);
            expect(snapshot[0]).toBeUndefined();
            expect(snapshot[1].typeId).toBe('minecraft:dirt');
            expect(snapshot[1]).not.toBe(view.slots[1]);
        });
    });

    describe('sync', () => {
        let understudy;
        let proxy;

        beforeEach(() => {
            understudy = makeView(3);
            proxy = makeView(3);
        });

        it('writes a player edit through to the understudy', () => {
            const base = ContainerSync.snapshot(proxy);
            proxy.slots[0] = makeItem('minecraft:diamond');

            ContainerSync.sync(understudy, proxy, base);

            expect(understudy.setItem).toHaveBeenCalledWith(0, proxy.slots[0]);
        });

        it('streams an understudy change into the proxy', () => {
            const base = ContainerSync.snapshot(proxy);
            understudy.slots[1] = makeItem('minecraft:cobblestone', 12);

            ContainerSync.sync(understudy, proxy, base);

            expect(proxy.setItem).toHaveBeenCalledWith(1, understudy.slots[1]);
        });

        it('lets the proxy win when both sides changed the same slot', () => {
            const base = ContainerSync.snapshot(proxy);
            understudy.slots[2] = makeItem('minecraft:flint');
            proxy.slots[2] = makeItem('minecraft:diamond');

            ContainerSync.sync(understudy, proxy, base);

            expect(understudy.setItem).toHaveBeenCalledWith(2, proxy.slots[2]);
            expect(proxy.setItem).not.toHaveBeenCalled();
        });

        it('writes nothing when neither side changed', () => {
            understudy.slots[0] = makeItem('minecraft:dirt', 2);
            proxy.slots[0] = makeItem('minecraft:dirt', 2);
            const base = ContainerSync.snapshot(proxy);

            ContainerSync.sync(understudy, proxy, base);

            expect(understudy.setItem).not.toHaveBeenCalled();
            expect(proxy.setItem).not.toHaveBeenCalled();
        });

        it('does not echo a write back on the following tick', () => {
            let base = ContainerSync.snapshot(proxy);
            understudy.slots[0] = makeItem('minecraft:cobblestone');
            base = ContainerSync.sync(understudy, proxy, base);

            understudy.setItem.mockClear();
            proxy.setItem.mockClear();
            ContainerSync.sync(understudy, proxy, base);

            expect(understudy.setItem).not.toHaveBeenCalled();
            expect(proxy.setItem).not.toHaveBeenCalled();
        });

        it('reverts the proxy on the next tick when the understudy write failed', () => {
            const base = ContainerSync.snapshot(proxy);
            understudy.slots[0] = makeItem('minecraft:flint');
            understudy.setItem.mockImplementation(() => {
                throw new Error('slot rejected the item');
            });
            proxy.slots[0] = makeItem('minecraft:diamond');

            const nextBase = ContainerSync.sync(understudy, proxy, base);

            understudy.setItem.mockImplementation(() => void 0);
            ContainerSync.sync(understudy, proxy, nextBase);

            expect(proxy.setItem).toHaveBeenCalledWith(0, understudy.slots[0]);
        });

        it('syncs only up to the smaller of the two views', () => {
            const bigProxy = makeView(5);
            const base = ContainerSync.snapshot(bigProxy);
            bigProxy.slots[4] = makeItem('minecraft:diamond');

            ContainerSync.sync(understudy, bigProxy, base);

            expect(understudy.setItem).not.toHaveBeenCalled();
        });

        it('returns a snapshot covering the full proxy view', () => {
            const bigProxy = makeView(5);
            const next = ContainerSync.sync(understudy, bigProxy, ContainerSync.snapshot(bigProxy));
            expect(next).toHaveLength(5);
        });
    });
});
