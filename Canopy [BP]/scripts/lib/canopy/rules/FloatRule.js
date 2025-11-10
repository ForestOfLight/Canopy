import { Rule } from './Rule';

export class FloatRule extends Rule {
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
        return Number(value);
    }

    getValueRange() {
        return this.valueRange;
    }

    isInRange(value) {
        return value >= this.valueRange.min && value <= this.valueRange.max;
    }
}