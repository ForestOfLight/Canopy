import { PeekCaptureEntity } from "./PeekCaptureEntity";

export class PeekArming {
    static TIMEOUT_TICKS = 200;

    #armed = new Map();
    #captures = new Map();

    arm(player) {
        if (player?.id === void 0)
            return;
        this.#armed.set(player.id, PeekArming.TIMEOUT_TICKS);
    }

    isArmed(playerId) {
        return this.#armed.has(playerId);
    }

    countDown(playerId) {
        const ticksLeft = this.#armed.get(playerId);
        if (ticksLeft === void 0)
            return false;
        if (ticksLeft > 1) {
            this.#armed.set(playerId, ticksLeft - 1);
            return false;
        }
        return true;
    }

    parkCapture(player) {
        const existing = this.#captures.get(player.id);
        if (existing?.isValid === true) {
            existing.teleportTo(player.getHeadLocation(), player.dimension);
            return;
        }
        this.#captures.set(player.id, PeekCaptureEntity.spawnFor(player));
    }

    isCapture(playerId, entity) {
        return this.#captures.get(playerId)?.matches(entity) === true;
    }

    clearCapture(playerId) {
        const capture = this.#captures.get(playerId);
        if (capture === void 0)
            return;
        capture.remove();
        this.#captures.delete(playerId);
    }

    clear(playerId) {
        if (playerId === void 0)
            return;
        this.#armed.delete(playerId);
        this.clearCapture(playerId);
    }

    clearAll() {
        this.#armed.clear();
        [...this.#captures.keys()].forEach(playerId => this.clearCapture(playerId));
    }
}
