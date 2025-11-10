import { Rule } from './Rule';

export class IntegerRule extends Rule {
    valueRange;

    constructor(options) {
        options.defaulValue = options.defaultValue || 0;
        super({ ...options });
        this.valueRange = options.valueRange;
    }

    getDescription() {
        return { rawtext: [super.getDescription(), {text: ' '}, { translate: 'rules.generic.defaultvalue', with: [String(this.getDefaultValue())] }] };
    }

    getType() {
        return 'integer';
    }
    
    isInDomain(value) {
        return Math.floor(value) === value;
    }

    getValueRange() {
        return this.valueRange;
    }

    isInRange(value) {
        return value >= this.valueRange.min && value <= this.valueRange.max;
    }
}