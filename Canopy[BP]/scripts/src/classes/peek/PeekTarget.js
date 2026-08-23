import { ButtonState, EntityComponentTypes, InputButton } from "@minecraft/server";
import { PeekView } from "./PeekView";

export class PeekTarget {
    static #TIP_TRANSLATE_KEY = "commands.peek.tip";

    #target;
    #viewMode = PeekView.viewModeFor(false);

    constructor(target) {
        this.#target = target;
    }

    get target() {
        return this.#target;
    }

    get viewMode() {
        return this.#viewMode;
    }

    get tipTranslateKey() {
        if (!PeekView.isPaged(PeekTarget.containerOf(this.#target)))
            return void 0;
        return PeekTarget.#TIP_TRANSLATE_KEY;
    }

    static containerOf(target) {
        try {
            if (target === void 0 || target.isValid === false)
                return void 0;
            return target.getComponent(EntityComponentTypes.Inventory)?.container;
        } catch {
            return void 0;
        }
    }

    refresh(player) {
        this.#viewMode = PeekView.viewModeFor(PeekTarget.#isSneaking(player));
    }

    static #isSneaking(player) {
        return player?.inputInfo?.getButtonState(InputButton.Sneak) === ButtonState.Pressed;
    }

    isAlive() {
        return PeekTarget.containerOf(this.#target) !== void 0;
    }

    matches(other) {
        if (other === void 0 || this.#target === void 0)
            return false;
        if (this.#target.id !== void 0 || other.id !== void 0)
            return this.#target.id === other.id;
        if (this.#target.typeId !== other.typeId)
            return false;
        return this.#target.dimension?.id === other.dimension?.id
            && PeekTarget.#sameLocation(this.#target.location, other.location);
    }

    displayName() {
        const name = this.#targetName();
        if (!PeekView.isPaged(PeekTarget.containerOf(this.#target)))
            return name;
        return `${name} - %${PeekView.titleKeyFor(this.#viewMode)}`;
    }

    resolveView() {
        const container = PeekTarget.containerOf(this.#target);
        if (container === void 0)
            return void 0;
        return new PeekView(container, this.#viewMode);
    }

    #targetName() {
        const localizationKey = this.#target?.localizationKey;
        if (localizationKey === void 0)
            return this.#target?.typeId ?? "";
        return `%${localizationKey}`;
    }

    static #sameLocation(locationA, locationB) {
        if (locationA === void 0 || locationB === void 0)
            return false;
        return locationA.x === locationB.x
            && locationA.y === locationB.y
            && locationA.z === locationB.z;
    }
}
