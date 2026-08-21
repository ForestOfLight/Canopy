import { EntityComponentTypes, GameMode, system, world } from "@minecraft/server";
import { getRaycastResults, getClosestTarget } from "../../../include/utils";
import { ProxyInventoryEntity } from "../proxy/ProxyInventoryEntity";
import { layoutForTarget } from "../proxy/ProxyLayout";
import { ProxyContainerSession } from "../proxy/ProxyContainerSession";
import { proxySessionRegistry } from "../proxy/ProxySessionRegistry";
import { PeekTarget } from "./PeekTarget";
import { PeekArming } from "./PeekArming";

const OPERATOR_PERMISSION_LEVEL = 2;
const PLAYER_TYPE_ID = "minecraft:player";

export class PeekProxyManager {
    static OWNER = "peek";
    static PEEK_ITEM_ID = "minecraft:spyglass";
    static SPYGLASS_RANGE = 6 * 16;
    static COMMAND_RANGE = 6 * 16;

    #registry;
    #runner = void 0;
    #arming = new PeekArming();
    #handlers = void 0;

    constructor(registry = proxySessionRegistry) {
        this.#registry = registry;
    }

    get sessionCount() {
        return this.#registry.countFor(PeekProxyManager.OWNER);
    }

    get isTicking() {
        return this.#runner !== void 0;
    }

    static isOperator(player) {
        return player?.playerPermissionLevel === OPERATOR_PERMISSION_LEVEL;
    }

    static isCreative(player) {
        try {
            return player?.getGameMode() === GameMode.Creative;
        } catch {
            return false;
        }
    }

    static canPeek(player) {
        return PeekProxyManager.isOperator(player) && PeekProxyManager.isCreative(player);
    }

    start() {
        if (this.#runner !== void 0)
            return;
        this.#registry.start();
        this.#subscribeToEvents();
        this.#runner = system.runInterval(() => this.onTick());
    }

    stop() {
        if (this.#runner !== void 0) {
            system.clearRun(this.#runner);
            this.#runner = void 0;
        }
        this.#unsubscribeFromEvents();
        this.#arming.clearAll();
        this.#disposeOwnSessions();
    }

    armFromCommand(player) {
        this.#arming.arm(player);
    }

    isArmedFromCommand(playerId) {
        return this.#arming.isArmed(playerId);
    }

    onPlayerInteractWithEntity(event) {
        const player = event?.player;
        if (player?.id === void 0)
            return;
        if (!this.#arming.isCapture(player.id, event.target))
            return;
        this.#disarm(player.id);
        player.sendMessage({ translate: "commands.peek.fail.notarget" });
    }

    onPlayerLeave(event) {
        this.#disarm(event?.playerId);
    }

    onTick() {
        world.getAllPlayers().forEach(player => this.updateFor(player));
    }

    updateFor(player) {
        const range = this.#peekRangeFor(player);
        if (range === void 0) {
            this.#reportLostPermission(player);
            this.#disarm(player?.id);
            return;
        }
        if (this.#tickArm(player))
            return;
        const target = this.#findTarget(player, range);
        if (target === void 0) {
            this.#onNoTarget(player);
            return;
        }
        this.#arming.clearCapture(player.id);
        this.#ensureSession(player, target);
    }

    #tickArm(player) {
        if (this.#ownSession(player.id)?.isOpen === true) {
            this.#arming.clear(player.id);
            return false;
        }
        if (!this.#arming.countDown(player.id))
            return false;
        this.#disarm(player.id);
        player.sendMessage({ translate: "commands.peek.expired" });
        return true;
    }

    #reportLostPermission(player) {
        if (player?.isValid !== true || !this.#arming.isArmed(player.id))
            return;
        if (!PeekProxyManager.isOperator(player)) {
            player.sendMessage({ translate: "commands.peek.fail.notoperator" });
            return;
        }
        if (!PeekProxyManager.isCreative(player))
            player.sendMessage({ translate: "commands.peek.fail.notcreative" });
    }

    #onNoTarget(player) {
        this.#stopLooking(player.id);
        if (!this.#arming.isArmed(player.id))
            return;
        if (this.#registry.get(player.id) !== void 0)
            return;
        this.#arming.parkCapture(player);
    }

    #peekRangeFor(player) {
        if (player?.isValid !== true || !PeekProxyManager.canPeek(player))
            return void 0;
        if (this.#arming.isArmed(player.id))
            return PeekProxyManager.COMMAND_RANGE;
        if (this.#isHoldingPeekItem(player))
            return PeekProxyManager.SPYGLASS_RANGE;
        return void 0;
    }

    #isHoldingPeekItem(player) {
        try {
            const container = player.getComponent(EntityComponentTypes.Inventory)?.container;
            return container?.getItem(player.selectedSlotIndex)?.typeId === PeekProxyManager.PEEK_ITEM_ID;
        } catch {
            return false;
        }
    }

    #findTarget(player, range) {
        try {
            return this.#findTargetUnguarded(player, range);
        } catch {
            return void 0;
        }
    }

    #findTargetUnguarded(player, range) {
        const { blockRayResult, entityRayResult } = getRaycastResults(player, range);
        const hits = (entityRayResult ?? []).filter(hit => this.#isPeekableEntity(hit?.entity));
        if (!blockRayResult && hits.length === 0)
            return void 0;
        const target = getClosestTarget(player, blockRayResult, hits);
        if (target === void 0 || PeekTarget.containerOf(target) === void 0)
            return void 0;
        return target;
    }

    #isPeekableEntity(entity) {
        if (entity === void 0 || entity.typeId === PLAYER_TYPE_ID)
            return false;
        return !ProxyInventoryEntity.isProxyEntity(entity);
    }

    #ensureSession(player, target) {
        const existing = this.#registry.get(player.id);
        if (existing !== void 0) {
            this.#refreshExisting(existing, player, target);
            return;
        }
        this.#openSession(player, target);
    }

    #refreshExisting(existing, player, target) {
        if (this.#registry.ownerOf(player.id) !== PeekProxyManager.OWNER)
            return;
        if (existing.target?.matches(target) === true) {
            existing.onStartLooking();
            return;
        }
        if (existing.isOpen)
            return;
        existing.dispose();
        this.#registry.dropIfDisposed(existing);
        this.#openSession(player, target);
    }

    #openSession(player, target) {
        const peekTarget = new PeekTarget(target);
        const layout = layoutForTarget(target.typeId);
        const proxy = ProxyInventoryEntity.spawnFor(player, layout);
        this.#registry.add(new ProxyContainerSession(player, peekTarget, proxy), PeekProxyManager.OWNER);
    }

    #disarm(playerId) {
        if (playerId === void 0)
            return;
        this.#arming.clear(playerId);
        this.#stopLooking(playerId);
    }

    #stopLooking(playerId) {
        const session = this.#ownSession(playerId);
        if (session === void 0)
            return;
        session.onStopLooking();
        this.#registry.dropIfDisposed(session);
    }

    #subscribeToEvents() {
        if (this.#handlers !== void 0)
            return;
        this.#handlers = {
            interact: event => this.onPlayerInteractWithEntity(event),
            playerLeave: event => this.onPlayerLeave(event)
        };
        world.afterEvents.playerInteractWithEntity.subscribe(this.#handlers.interact);
        world.afterEvents.playerLeave.subscribe(this.#handlers.playerLeave);
    }

    #unsubscribeFromEvents() {
        const handlers = this.#handlers;
        this.#handlers = void 0;
        if (handlers === void 0)
            return;
        world.afterEvents.playerInteractWithEntity.unsubscribe(handlers.interact);
        world.afterEvents.playerLeave.unsubscribe(handlers.playerLeave);
    }


    #ownSession(playerId) {
        if (this.#registry.ownerOf(playerId) !== PeekProxyManager.OWNER)
            return void 0;
        return this.#registry.get(playerId);
    }

    #disposeOwnSessions() {
        world.getAllPlayers().forEach(player => {
            const session = this.#ownSession(player?.id);
            if (session === void 0)
                return;
            session.dispose();
            this.#registry.dropIfDisposed(session);
        });
    }
}

export const peekProxyManager = new PeekProxyManager();
