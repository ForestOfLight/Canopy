import { EntityComponentTypes } from "@minecraft/server";
import { ContainerSync } from "./ContainerSync";
import { UnderstudyEditView } from "./UnderstudyEditView";

export class UnderstudyEditSession {
    static #TIP_TRANSLATE_KEY = "simplayer.editor.tip";

    #player;
    #understudy;
    #proxy;
    #proxyBase = [];
    #mirroredSlotCount = void 0;
    #viewMode = void 0;
    #isOpen = false;
    #disposalPending = false;
    #isDisposed = false;

    constructor(player, understudy, proxy) {
        this.#player = player;
        this.#understudy = understudy;
        this.#proxy = proxy;
        this.#refreshPresentation();
    }

    get playerId() {
        return this.#player.id;
    }

    get understudy() {
        return this.#understudy;
    }

    get proxyEntity() {
        return this.#proxy;
    }

    get isOpen() {
        return this.#isOpen;
    }

    get viewMode() {
        return this.#viewMode;
    }

    get isDisposed() {
        return this.#isDisposed;
    }

    matchesUnderstudy(understudy) {
        if (this.#understudy === void 0 || understudy === void 0)
            return false;
        return this.#understudy.name === understudy.name;
    }

    onTick() {
        if (this.#isDisposed)
            return;
        if (!this.#isAlive()) {
            this.dispose();
            return;
        }
        if (!this.#isOpen) {
            this.#proxy.teleportTo(this.#player.getHeadLocation(), this.#player.dimension);
            this.#refreshPresentation();
            return;
        }
        this.#runSync();
    }

    onContainerOpened() {
        if (this.#isDisposed)
            return;
        this.#isOpen = true;
        const proxyContainer = this.#proxy.container;
        if (proxyContainer === void 0)
            return;
        this.#proxyBase = ContainerSync.snapshot(proxyContainer);
        this.#runSync();
    }

    onContainerClosed() {
        if (this.#isDisposed)
            return;
        this.#isOpen = false;
        this.#tryReturnOverflowItems();
        this.#clearMirroredSlots();
        if (this.#disposalPending)
            this.dispose();
    }

    onStopLooking() {
        if (this.#isOpen) {
            this.#disposalPending = true;
            return;
        }
        this.dispose();
    }

    onStartLooking() {
        this.#disposalPending = false;
    }

    dispose() {
        if (this.#isDisposed)
            return;
        this.#isDisposed = true;
        this.#isOpen = false;
        this.#tryReturnOverflowItems();
        this.#proxy.remove();
    }

    #refreshPresentation() {
        this.#viewMode = UnderstudyEditView.viewModeFor(this.#player?.isSneaking);
        this.#proxy?.setName(this.#formatProxyName());
        this.#showInteractionTip();
    }

    #formatProxyName() {
        return `${this.#understudy?.name ?? ""} | %${UnderstudyEditView.titleKeyFor(this.#viewMode)}`;
    }

    #showInteractionTip() {
        this.#player?.onScreenDisplay?.setActionBar?.({ translate: UnderstudyEditSession.#TIP_TRANSLATE_KEY });
    }

    #runSync() {
        const understudyView = this.#resolveUnderstudyView();
        const proxyContainer = this.#proxy.container;
        if (understudyView === void 0 || proxyContainer === void 0)
            return;
        const result = ContainerSync.sync(understudyView, proxyContainer, this.#proxyBase);
        this.#proxyBase = result.proxyBase;
        this.#returnRejectedItems(result.rejectedItemStacks);
    }

    #isAlive() {
        return this.#player?.isValid === true
            && this.#understudy?.isConnected() === true
            && this.#proxy?.isValid === true
            && this.#proxy.dimensionId === this.#player.dimension?.id;
    }

    #resolveUnderstudyView() {
        try {
            const inventoryContainer = this.#understudy?.getInventory();
            if (inventoryContainer === void 0)
                return void 0;
            const understudyView = new UnderstudyEditView(inventoryContainer, this.#understudy.getEquippable(), this.#viewMode);
            this.#mirroredSlotCount = understudyView.size;
            return understudyView;
        } catch (error) {
            console.warn("[Canopy] Failed to read the understudy inventory:", error);
            return void 0;
        }
    }

    #clearMirroredSlots() {
        const proxyContainer = this.#proxy.container;
        const boundary = this.#resolveMirroredSlotCount();
        if (proxyContainer === void 0 || boundary === void 0)
            return;
        for (let slotIndex = 0; slotIndex < Math.min(boundary, proxyContainer.size); slotIndex++)
            this.#tryClearSlot(proxyContainer, slotIndex);
        this.#proxyBase = [];
    }

    #tryClearSlot(proxyContainer, slotIndex) {
        try {
            proxyContainer.setItem(slotIndex, void 0);
        } catch (error) {
            console.warn(`[Canopy] Failed to clear inventory proxy slot ${slotIndex}:`, error);
        }
    }

    #tryReturnOverflowItems() {
        try {
            this.#returnOverflowItems();
        } catch (error) {
            console.warn("[Canopy] Failed to return inventory proxy overflow items:", error);
        }
    }

    #returnOverflowItems() {
        const proxyContainer = this.#proxy.container;
        const understudyView = this.#resolveUnderstudyView();
        const boundary = understudyView?.size ?? this.#mirroredSlotCount;
        if (proxyContainer === void 0 || boundary === void 0)
            return;
        for (let slotIndex = 0; slotIndex < proxyContainer.size; slotIndex++) {
            if (this.#isMirroredSlot(understudyView, boundary, slotIndex))
                continue;
            this.#returnOverflowSlot(proxyContainer, slotIndex);
        }
    }

    #isMirroredSlot(understudyView, boundary, slotIndex) {
        if (slotIndex >= boundary)
            return false;
        return understudyView?.hasSlot(slotIndex) !== false;
    }

    #resolveMirroredSlotCount() {
        return this.#resolveUnderstudyView()?.size ?? this.#mirroredSlotCount;
    }

    #returnOverflowSlot(proxyContainer, slotIndex) {
        try {
            const itemStack = proxyContainer.getItem(slotIndex);
            if (itemStack === void 0)
                return;
            this.#returnItem(itemStack);
            proxyContainer.setItem(slotIndex, void 0);
        } catch (error) {
            console.warn(`[Canopy] Failed to return inventory proxy slot ${slotIndex}:`, error);
        }
    }

    #returnRejectedItems(rejectedItemStacks) {
        rejectedItemStacks.forEach(itemStack => this.#tryReturnItem(itemStack));
    }

    #tryReturnItem(itemStack) {
        try {
            this.#returnItem(itemStack);
        } catch (error) {
            console.warn("[Canopy] Failed to return a rejected item:", error);
        }
    }

    #returnItem(itemStack) {
        if (this.#player?.isValid === true) {
            this.#giveToPlayer(itemStack);
            return;
        }
        this.#dropAtProxy(itemStack);
    }

    #giveToPlayer(itemStack) {
        const playerContainer = this.#player.getComponent(EntityComponentTypes.Inventory)?.container;
        const leftover = playerContainer === void 0 ? itemStack : playerContainer.addItem(itemStack);
        if (leftover !== void 0)
            this.#player.dimension.spawnItem(leftover, this.#player.location);
    }

    #dropAtProxy(itemStack) {
        if (this.#proxy?.dropItem(itemStack) === true)
            return;
        console.warn(`[Canopy] Lost inventory proxy item ${itemStack?.typeId}: neither the player nor the proxy could hold it.`);
    }
}
