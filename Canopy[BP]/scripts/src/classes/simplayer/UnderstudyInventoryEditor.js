import { playerStartLookingAtUnderstudy } from "./events/PlayerStartLookingAtUnderstudyEvent";
import { playerStopLookingAtUnderstudy } from "./events/PlayerStopLookingAtUnderstudyEvent";
import { ProxyInventoryEntity } from "../proxy/ProxyInventoryEntity";
import { ProxyLayout } from "../proxy/ProxyLayout";
import { ProxyContainerSession } from "../proxy/ProxyContainerSession";
import { proxySessionRegistry } from "../proxy/ProxySessionRegistry";
import { UnderstudyTarget } from "./editor/UnderstudyTarget";

export class UnderstudyInventoryEditor {
    static OWNER = "understudy";

    #registry;
    #isStarted = false;
    #handlers = void 0;

    constructor(registry = proxySessionRegistry) {
        this.#registry = registry;
    }

    get sessionCount() {
        return this.#registry.countFor(UnderstudyInventoryEditor.OWNER);
    }

    get isTicking() {
        return this.#registry.isTicking;
    }

    start() {
        if (this.#isStarted)
            return;
        this.#isStarted = true;
        this.#handlers = {
            startLooking: event => this.onStartLooking(event),
            stopLooking: event => this.onStopLooking(event)
        };
        playerStartLookingAtUnderstudy.subscribe(this.#handlers.startLooking);
        playerStopLookingAtUnderstudy.subscribe(this.#handlers.stopLooking);
        this.#registry.start();
    }

    reset() {
        this.#registry.reset();
        this.#unsubscribeAll();
        this.#isStarted = false;
    }

    onStartLooking(event) {
        const player = event.player;
        if (player?.isValid !== true)
            return;
        const existing = this.#registry.get(player.id);
        if (existing !== void 0) {
            if (existing.target?.matches(event.understudy) === true)
                existing.onStartLooking();
            return;
        }
        const proxy = ProxyInventoryEntity.spawnFor(player, ProxyLayout.Chest);
        const session = new ProxyContainerSession(player, new UnderstudyTarget(event.understudy), proxy);
        this.#registry.add(session, UnderstudyInventoryEditor.OWNER);
    }

    onStopLooking(event) {
        const session = this.#ownSession(event.player?.id);
        if (session === void 0)
            return;
        session.onStopLooking();
        this.#registry.dropIfDisposed(session);
    }

    onContainerOpened(event) {
        this.#registry.onContainerOpened(event);
    }

    onContainerClosed(event) {
        this.#registry.onContainerClosed(event);
    }

    onPlayerLeave(event) {
        this.#registry.onPlayerLeave(event);
    }

    onTick() {
        this.#registry.onTick();
    }

    #ownSession(playerId) {
        if (this.#registry.ownerOf(playerId) !== UnderstudyInventoryEditor.OWNER)
            return void 0;
        return this.#registry.get(playerId);
    }

    #unsubscribeAll() {
        const handlers = this.#handlers;
        this.#handlers = void 0;
        if (handlers === void 0)
            return;
        playerStartLookingAtUnderstudy.unsubscribe(handlers.startLooking);
        playerStopLookingAtUnderstudy.unsubscribe(handlers.stopLooking);
    }
}

export const understudyInventoryEditor = new UnderstudyInventoryEditor();
