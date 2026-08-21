import { UnderstudyEditView } from "./UnderstudyEditView";

export class UnderstudyTarget {
    static #TIP_TRANSLATE_KEY = "simplayer.editor.tip";

    #understudy;
    #viewMode = UnderstudyEditView.normalizeViewMode(void 0);

    constructor(understudy) {
        this.#understudy = understudy;
    }

    get understudy() {
        return this.#understudy;
    }

    get viewMode() {
        return this.#viewMode;
    }

    get tipTranslateKey() {
        return UnderstudyTarget.#TIP_TRANSLATE_KEY;
    }

    matches(understudy) {
        if (this.#understudy === void 0 || understudy === void 0)
            return false;
        return this.#understudy.name === understudy.name;
    }

    refresh(player) {
        this.#viewMode = UnderstudyEditView.viewModeFor(player?.isSneaking);
    }

    isAlive() {
        return this.#understudy?.isConnected() === true;
    }

    displayName() {
        return `${this.#understudy?.name ?? ""} - %${UnderstudyEditView.titleKeyFor(this.#viewMode)}`;
    }

    resolveView() {
        const inventoryContainer = this.#understudy?.getInventory();
        if (inventoryContainer === void 0)
            return void 0;
        return new UnderstudyEditView(inventoryContainer, this.#understudy.getEquippable(), this.#viewMode);
    }
}
