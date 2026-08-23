import { expect, it, describe, vi, beforeEach } from "vitest";
import { allowPeekInventory } from "../../../../../Canopy[BP]/scripts/src/rules/allowPeekInventory";
import { peekProxyManager } from "../../../../../Canopy[BP]/scripts/src/classes/peek/PeekProxyManager";

describe('allowPeekInventory', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('starts parking peek proxies when enabled', () => {
        const startSpy = vi.spyOn(peekProxyManager, 'start').mockImplementation(() => void 0);
        allowPeekInventory.onEnable();
        expect(startSpy).toHaveBeenCalled();
    });

    it('tears every peek proxy down when disabled', () => {
        const stopSpy = vi.spyOn(peekProxyManager, 'stop').mockImplementation(() => void 0);
        allowPeekInventory.onDisable();
        expect(stopSpy).toHaveBeenCalled();
    });

    it('no longer cancels player interactions to show a form', () => {
        expect(allowPeekInventory.onPlayerInteraction).toBeUndefined();
        expect(allowPeekInventory.subscribeToEvents).toBeUndefined();
    });
});
