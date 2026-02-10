import { Rule } from './Rule';

export class IntegerRule extends Rule {
    valueRange;

    constructor(options) {
        options.defaultValue = options.defaultValue || 0;
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

    getAllowedValues() {
        return this.valueRange;
    }

    isInRange(value) {
        return this.valueRange.other?.includes(value) || (value >= this.valueRange?.range.min && value <= this.valueRange.range.max);
    }
}