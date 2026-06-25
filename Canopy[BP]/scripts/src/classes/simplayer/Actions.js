import { system } from "@minecraft/server";
import { RepeatableAction } from "./RepeatableAction";

export class Actions {
    #singleActions = [];
    #repeatingActions = [];

    constructor(understudy) {
        this.understudy = understudy;
    }

    onTick() {
        for (const singleAction of this.#singleActions)
            singleAction.perform();
        this.#singleActions.length = 0;
        for (const repeatingAction of this.#repeatingActions)
            repeatingAction.onTick();
    }

    once(type, afterTicks = void 0) {
        const repeatableAction = new RepeatableAction(this.understudy, type);
        if (afterTicks === void 0)
            this.#singleActions.push(repeatableAction);
        else
            system.runTimeout(() => this.#singleActions.push(repeatableAction), afterTicks);
    }

    repeat(type, intervalTicks = 0) {
        if (this.has(type))
            this.remove(type);
        const repeatingAction = new RepeatableAction(this.understudy, type, intervalTicks);
        this.#repeatingActions.push(repeatingAction);
    }

    get(type) {
        return this.#repeatingActions.find(action => action.type === type);
    }

    has(type) {
        return this.#repeatingActions.some(action => action.type === type);
    }

    isEmpty() {
        return this.#singleActions.length === 0 && this.#repeatingActions.length === 0;
    }

    remove(type) {
        this.#repeatingActions = this.#repeatingActions.filter(action => action.type !== type);
    }

    clear() {
        this.#repeatingActions.length = 0;
        this.#singleActions.length = 0;
    }
}
