export class DebugDisplayElement {
    constructor(entity) {
        if (this.constructor === DebugDisplayElement) 
            throw new TypeError("Abstract class 'DebugDisplayElement' cannot be instantiated directly.");
        this.entity = entity;
        this.type = this.constructor.name;
    }
}