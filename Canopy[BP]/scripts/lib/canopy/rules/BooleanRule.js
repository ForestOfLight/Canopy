import { Rule } from './Rule';

export class BooleanRule extends Rule {
    constructor(options) {
        options.suggestedOptions = options.suggestedOptions ?? [false, true];
        options.defaultValue = options.defaultValue ?? false;
        /* eslint-disable prefer-const*/
        let self;
        options.onModifyCallback = (value) => self?.onModifyBool(value);
        super({ ...options });
        self = this;
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