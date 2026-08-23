export const PeekViewMode = Object.freeze({
    Top: "top",
    Bottom: "bottom"
});

const TITLE_KEYS = {
    [PeekViewMode.Top]: "commands.peek.view.top",
    [PeekViewMode.Bottom]: "commands.peek.view.bottom"
};

export class PeekView {
    static PAGE_SLOT_COUNT = 27;

    #container;
    #viewMode;

    constructor(container, viewMode) {
        this.#container = container;
        this.#viewMode = PeekView.resolveViewModeFor(container, viewMode);
    }

    static viewModeFor(isSneaking) {
        if (isSneaking === true)
            return PeekViewMode.Bottom;
        return PeekViewMode.Top;
    }

    static normalizeViewMode(viewMode) {
        if (viewMode === PeekViewMode.Bottom)
            return PeekViewMode.Bottom;
        return PeekViewMode.Top;
    }

    static isPaged(container) {
        return (container?.size ?? 0) > PeekView.PAGE_SLOT_COUNT;
    }

    static resolveViewModeFor(container, viewMode) {
        if (!PeekView.isPaged(container))
            return PeekViewMode.Top;
        return PeekView.normalizeViewMode(viewMode);
    }

    static titleKeyFor(viewMode) {
        return TITLE_KEYS[PeekView.normalizeViewMode(viewMode)];
    }

    get viewMode() {
        return this.#viewMode;
    }

    get size() {
        if (this.#viewMode === PeekViewMode.Bottom)
            return this.#container.size - PeekView.PAGE_SLOT_COUNT;
        return Math.min(PeekView.PAGE_SLOT_COUNT, this.#container.size);
    }

    hasSlot(slotIndex) {
        return slotIndex >= 0 && slotIndex < this.size;
    }

    getItem(slotIndex) {
        if (!this.hasSlot(slotIndex))
            return void 0;
        return this.#container.getItem(this.#containerSlotFor(slotIndex));
    }

    setItem(slotIndex, itemStack) {
        if (!this.hasSlot(slotIndex))
            return;
        this.#container.setItem(this.#containerSlotFor(slotIndex), itemStack);
    }

    #containerSlotFor(slotIndex) {
        if (this.#viewMode === PeekViewMode.Bottom)
            return slotIndex + PeekView.PAGE_SLOT_COUNT;
        return slotIndex;
    }
}
