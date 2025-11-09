import { DebugDisplayElement } from "./DebugDisplayElement";

export class DebugDisplayTextElement extends DebugDisplayElement {
    constructor(entity) {
        super(entity);
        if (this.constructor === DebugDisplayTextElement) 
            throw new TypeError("Abstract class 'DebugDisplayTextElement' cannot be instantiated directly.");
    }

    getFormattedData() {
        throw new Error("Method 'getFormattedData()' must be implemented.");
    }
}