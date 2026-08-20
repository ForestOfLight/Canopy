import { EntityComponentTypes } from "@minecraft/server";
import { UnderstudyStorageView } from "../UnderstudyStorageView";
import { ContainerSync } from "./ContainerSync";

export class UnderstudyEditSession {
    #player;
    #understudy;
    #proxy;
    #proxyBase = [];
    #isOpen = false;
    #disposalPending = false;
    #isDisposed = false;

    constructor(player, understudy, proxy) {
        this.#player = player;
        this.#understudy = understudy;
        this.#proxy = proxy;
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

    get isDisposed() {
        return this.#isDisposed;
    }

    matchesUnderstudy(understudy) {
        return this.#understudy?.name === understudy?.name;
    }

    onTick() {
        if (this.#isDisposed)
            return;
        if (!this.#isAlive()) {
            this.dispose();
            return;
        }
        if (!this.#isOpen) {
            this.#proxy.teleportTo(this.#player.getHeadLocation());
            return;
        }
        const understudyView = this.#resolveUnderstudyView();
        const proxyContainer = this.#proxy.container;
        if (understudyView === void 0 || proxyContainer === void 0)
            return;
        this.#proxyBase = ContainerSync.sync(understudyView, proxyContainer, this.#proxyBase);
    }

    onContainerOpened() {
        this.#isOpen = true;
        const understudyView = this.#resolveUnderstudyView();
        const proxyContainer = this.#proxy.container;
        if (understudyView === void 0 || proxyContainer === void 0)
            return;
        this.#proxyBase = ContainerSync.snapshot(proxyContainer);
        this.#proxyBase = ContainerSync.sync(understudyView, proxyContainer, this.#proxyBase);
    }

    onContainerClosed() {
        this.#isOpen = false;
        this.#returnOverflowItems();
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
        this.#proxy.remove();
    }

    #isAlive() {
        return this.#player?.isValid === true && this.#understudy?.isConnected() === true;
    }

    #resolveUnderstudyView() {
        const inventoryContainer = this.#understudy.getInventory();
        if (inventoryContainer === void 0)
            return void 0;
        return new UnderstudyStorageView(inventoryContainer, this.#understudy.getEquippable());
    }

    #returnOverflowItems() {
        const understudyView = this.#resolveUnderstudyView();
        const proxyContainer = this.#proxy.container;
        if (understudyView === void 0 || proxyContainer === void 0)
            return;
        for (let slotIndex = understudyView.size; slotIndex < proxyContainer.size; slotIndex++)
            this.#returnOverflowSlot(proxyContainer, slotIndex);
    }

    #returnOverflowSlot(proxyContainer, slotIndex) {
        const itemStack = proxyContainer.getItem(slotIndex);
        if (itemStack === void 0)
            return;
        proxyContainer.setItem(slotIndex, void 0);
        const leftover = this.#player.getComponent(EntityComponentTypes.Inventory)?.container?.addItem(itemStack);
        if (leftover !== void 0)
            this.#player.dimension.spawnItem(leftover, this.#player.location);
    }
}
