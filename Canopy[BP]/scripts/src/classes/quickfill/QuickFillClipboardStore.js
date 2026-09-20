export class QuickFillClipboardStore {
    static activeClipboards = new WeakMap();

    static get(player) {
        return this.activeClipboards.get(player)?.clone();
    }

    static set(player, clipboard) {
        if (!player || !clipboard)
            return false;

        this.activeClipboards.set(player, clipboard.clone());
        return true;
    }

    static clear(player) {
        return this.activeClipboards.delete(player);
    }

    static has(player) {
        return this.activeClipboards.has(player);
    }
}