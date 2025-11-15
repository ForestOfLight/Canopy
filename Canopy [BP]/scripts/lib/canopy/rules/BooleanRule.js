import { Rule } from './Rule.js';

export class BooleanRule extends Rule {
    constructor(options) {
        options.defaultValue = options.defaultValue || false;
        options.onModifyCallback = (value) => this.onModifyBool(value);
        super({ ...options });
        this.onEnable = options.onEnableCallback || (() => {});
        this.onDisable = options.onDisableCallback || (() => {});
    }

    getType() {
        return 'boolean';
    }

    onModifyBool(newValue) {
        if (newValue === true)
            this.onEnable();
        else if (newValue === false)
            this.onDisable();
        else
            throw new Error(`[Canopy] Unexpected modification value encountered for rule ${this.getID()}: ${newValue}`);
    }
    
    isInDomain(value) {
        return value === true || value === false;
    }

    isInRange(value) {
        return this.isInDomain(value);
    }
}