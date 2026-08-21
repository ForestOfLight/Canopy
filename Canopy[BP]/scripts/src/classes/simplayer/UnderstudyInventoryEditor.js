import { system, world } from "@minecraft/server";
import { playerStartLookingAtUnderstudy } from "./events/PlayerStartLookingAtUnderstudyEvent";
import { playerStopLookingAtUnderstudy } from "./events/PlayerStopLookingAtUnderstudyEvent";
import { ProxyInventoryEntity } from "./editor/ProxyInventoryEntity";
import { UnderstudyEditSession } from "./editor/UnderstudyEditSession";

export class UnderstudyInventoryEditor {
    static #ENTITY_FILTER = {
        entityFilter: {
            type: ProxyInventoryEntity.entityTypeId,
            tags: [ProxyInventoryEntity.PROXY_TAG]
        }
    };

    #sessions = new Map();
    #runner = void 0;
    #isStarted = false;
    #handlers = void 0;

    get sessionCount() {
        return this.#sessions.size;
    }

    get isTicking() {
        return this.#runner !== void 0;
    }

    start() {
        if (this.#isStarted)
            return;
        this.#isStarted = true;
        this.#handlers = {
            startLooking: event => this.onStartLooking(event),
            stopLooking: event => this.onStopLooking(event),
            containerOpened: event => this.onContainerOpened(event),
            containerClosed: event => this.onContainerClosed(event),
            playerLeave: event => this.onPlayerLeave(event)
        };
        playerStartLookingAtUnderstudy.subscribe(this.#handlers.startLooking);
        playerStopLookingAtUnderstudy.subscribe(this.#handlers.stopLooking);
        world.afterEvents.entityContainerOpened.subscribe(
            this.#handlers.containerOpened,
            UnderstudyInventoryEditor.#ENTITY_FILTER
        );
        world.afterEvents.entityContainerClosed.subscribe(
            this.#handlers.containerClosed,
            UnderstudyInventoryEditor.#ENTITY_FILTER
        );
        world.afterEvents.playerLeave.subscribe(this.#handlers.playerLeave);
    }

    reset() {
        this.#sessions.forEach(session => session.dispose());
        this.#sessions.clear();
        this.#stopTicking();
        this.#unsubscribeAll();
        this.#isStarted = false;
    }

    #unsubscribeAll() {
        const handlers = this.#handlers;
        this.#handlers = void 0;
        if (handlers === void 0)
            return;
        playerStartLookingAtUnderstudy.unsubscribe(handlers.startLooking);
        playerStopLookingAtUnderstudy.unsubscribe(handlers.stopLooking);
        world.afterEvents.entityContainerOpened.unsubscribe(handlers.containerOpened);
        world.afterEvents.entityContainerClosed.unsubscribe(handlers.containerClosed);
        world.afterEvents.playerLeave.unsubscribe(handlers.playerLeave);
    }

    onStartLooking(event) {
        const player = event.player;
        if (player?.isValid !== true)
            return;
        const existing = this.#sessions.get(player.id);
        if (existing !== void 0) {
            if (existing.matchesUnderstudy(event.understudy))
                existing.onStartLooking();
            return;
        }
        const proxy = ProxyInventoryEntity.spawnFor(player);
        this.#sessions.set(player.id, new UnderstudyEditSession(player, event.understudy, proxy));
        this.#startTicking();
    }

    onStopLooking(event) {
        const session = this.#sessions.get(event.player?.id);
        if (session === void 0)
            return;
        session.onStopLooking();
        this.#dropIfDisposed(session);
    }

    onContainerOpened(event) {
        const session = this.#sessions.get(event.openSource?.entity?.id);
        if (session === void 0 || session.proxyEntity.entity !== event.entity)
            return;
        session.onContainerOpened();
    }

    onContainerClosed(event) {
        const session = this.#findSessionByProxyEntity(event.entity);
        if (session === void 0)
            return;
        session.onContainerClosed();
        this.#dropIfDisposed(session);
    }

    onPlayerLeave(event) {
        const session = this.#sessions.get(event.playerId);
        if (session === void 0)
            return;
        session.dispose();
        this.#dropIfDisposed(session);
    }

    onTick() {
        this.#sessions.forEach(session => {
            session.onTick();
            this.#dropIfDisposed(session);
        });
    }

    #findSessionByProxyEntity(entity) {
        for (const session of this.#sessions.values()) {
            if (session.proxyEntity.entity === entity)
                return session;
        }
        return void 0;
    }

    #dropIfDisposed(session) {
        if (!session.isDisposed)
            return;
        this.#sessions.delete(session.playerId);
        if (this.#sessions.size === 0)
            this.#stopTicking();
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

export const understudyInventoryEditor = new UnderstudyInventoryEditor();
