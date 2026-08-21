import { system, world } from "@minecraft/server";
import { ProxyInventoryEntity } from "./ProxyInventoryEntity";

export class ProxySessionRegistry {
    static #ENTITY_FILTER = {
        entityFilter: {
            families: [ProxyInventoryEntity.typeFamily]
        }
    };

    #entries = new Map();
    #runner = void 0;
    #handlers = void 0;

    get sessionCount() {
        return this.#entries.size;
    }

    get isTicking() {
        return this.#runner !== void 0;
    }

    start() {
        if (this.#handlers !== void 0)
            return;
        this.#handlers = {
            containerOpened: event => this.onContainerOpened(event),
            containerClosed: event => this.onContainerClosed(event),
            playerLeave: event => this.onPlayerLeave(event)
        };
        world.afterEvents.entityContainerOpened.subscribe(
            this.#handlers.containerOpened,
            ProxySessionRegistry.#ENTITY_FILTER
        );
        world.afterEvents.entityContainerClosed.subscribe(
            this.#handlers.containerClosed,
            ProxySessionRegistry.#ENTITY_FILTER
        );
        world.afterEvents.playerLeave.subscribe(this.#handlers.playerLeave);
    }

    reset() {
        this.#entries.forEach(entry => entry.session.dispose());
        this.#entries.clear();
        this.#stopTicking();
        this.#unsubscribeAll();
    }

    countFor(owner) {
        let count = 0;
        this.#entries.forEach(entry => {
            if (entry.owner === owner)
                count++;
        });
        return count;
    }

    get(playerId) {
        return this.#entries.get(playerId)?.session;
    }

    ownerOf(playerId) {
        return this.#entries.get(playerId)?.owner;
    }

    add(session, owner) {
        if (this.#entries.has(session.playerId))
            return false;
        this.#entries.set(session.playerId, { session, owner });
        this.#startTicking();
        return true;
    }

    dropIfDisposed(session) {
        if (session === void 0 || !session.isDisposed)
            return;
        this.#entries.delete(session.playerId);
        if (this.#entries.size === 0)
            this.#stopTicking();
    }

    onContainerOpened(event) {
        const session = this.get(event.openSource?.entity?.id);
        if (session === void 0 || session.proxyEntity.entity !== event.entity)
            return;
        session.onContainerOpened();
    }

    onContainerClosed(event) {
        const session = this.#findSessionByProxyEntity(event.entity);
        if (session === void 0)
            return;
        session.onContainerClosed();
        this.dropIfDisposed(session);
    }

    onPlayerLeave(event) {
        const session = this.get(event.playerId);
        if (session === void 0)
            return;
        session.dispose();
        this.dropIfDisposed(session);
    }

    onTick() {
        [...this.#entries.values()].forEach(entry => {
            entry.session.onTick();
            this.dropIfDisposed(entry.session);
        });
    }

    #findSessionByProxyEntity(entity) {
        for (const entry of this.#entries.values()) {
            if (entry.session.proxyEntity.entity === entity)
                return entry.session;
        }
        return void 0;
    }

    #unsubscribeAll() {
        const handlers = this.#handlers;
        this.#handlers = void 0;
        if (handlers === void 0)
            return;
        world.afterEvents.entityContainerOpened.unsubscribe(handlers.containerOpened);
        world.afterEvents.entityContainerClosed.unsubscribe(handlers.containerClosed);
        world.afterEvents.playerLeave.unsubscribe(handlers.playerLeave);
    }

    #startTicking() {
        if (this.#runner !== void 0)
            return;
        this.#runner = system.runInterval(() => this.onTick());
    }

    #stopTicking() {
        if (this.#runner === void 0)
            return;
        system.clearRun(this.#runner);
        this.#runner = void 0;
    }
}

export const proxySessionRegistry = new ProxySessionRegistry();
