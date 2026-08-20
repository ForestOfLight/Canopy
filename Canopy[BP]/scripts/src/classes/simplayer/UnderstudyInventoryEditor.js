import { system, world } from "@minecraft/server";
import { playerStartLookingAtUnderstudy } from "./events/PlayerStartLookingAtUnderstudyEvent";
import { playerStopLookingAtUnderstudy } from "./events/PlayerStopLookingAtUnderstudyEvent";
import { ProxyInventoryEntity } from "./editor/ProxyInventoryEntity";
import { UnderstudyEditSession } from "./editor/UnderstudyEditSession";

export class UnderstudyInventoryEditor {
    static #ENTITY_FILTER = {
        entityFilter: {
            type: "canopy:nbt_item_database",
            tags: [ProxyInventoryEntity.PROXY_TAG]
        }
    };

    #sessions = new Map();
    #runner = void 0;
    #isStarted = false;

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
        playerStartLookingAtUnderstudy.subscribe(event => this.onStartLooking(event));
        playerStopLookingAtUnderstudy.subscribe(event => this.onStopLooking(event));
        world.afterEvents.entityContainerOpened.subscribe(
            event => this.onContainerOpened(event),
            UnderstudyInventoryEditor.#ENTITY_FILTER
        );
        world.afterEvents.entityContainerClosed.subscribe(
            event => this.onContainerClosed(event),
            UnderstudyInventoryEditor.#ENTITY_FILTER
        );
        world.afterEvents.playerLeave.subscribe(event => this.onPlayerLeave(event));
    }

    reset() {
        this.#sessions.forEach(session => session.dispose());
        this.#sessions.clear();
        this.#stopTicking();
        this.#isStarted = false;
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
