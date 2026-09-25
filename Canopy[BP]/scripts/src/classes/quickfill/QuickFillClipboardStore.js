export class QuickFillClipboardStore {
    static activeClipboards = new WeakMap();
    static activePresetNames = new WeakMap();

    static get(player) {
        return this.activeClipboards.get(player)?.clone();
    }

    static getPresetName(player) {
        return this.activePresetNames.get(player);
    }

    static set(player, clipboard, presetName) {
        if (!player || !clipboard)
            return false;

        this.activeClipboards.set(player, clipboard.clone());
        if (presetName)
            this.activePresetNames.set(player, presetName);
        else
            this.activePresetNames.delete(player);
        return true;
    }

    static clear(player) {
        this.activePresetNames.delete(player);
        return this.activeClipboards.delete(player);
    }

    static has(player) {
        return this.activeClipboards.has(player);
    }
}
