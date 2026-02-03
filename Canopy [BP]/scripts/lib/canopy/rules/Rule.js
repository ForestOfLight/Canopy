import { world } from '@minecraft/server';
import { Rules } from "./Rules";
import { Extensions } from '../Extensions';

export class Rule {
    #category;
    #identifier;
    #description;
    #defaultValue;
    #contingentRules;
    #independentRules;
    #extension;

    constructor({ category, identifier, description = '', defaultValue = void 0,
                contingentRules = [], independentRules = [], onModifyCallback = () => {}, extensionName = false }) {
        if (this.constructor === Rule) 
            throw new TypeError("Abstract class 'Rule' cannot be instantiated directly.");
        this.#category = category;
        this.#identifier = identifier;
        this.#description = this.#parseDescription(description);
        this.#defaultValue = defaultValue;
        this.#contingentRules = contingentRules;
        this.#independentRules = independentRules;
        this.onModify = onModifyCallback;
        this.#extension = Extensions.getFromName(extensionName);
        Rules.register(this);
    }

    getCategory() {
        return this.#category;
    }

    getID() {
        return this.#identifier;
    }

    getDescription() {
        return this.#description;
    }

    getContigentRuleIDs() {
        return this.#contingentRules;
    }

    getIndependentRuleIDs() {
        return this.#independentRules;
    }

    getDependentRuleIDs() {
        return Rules.getDependentRuleIDs(this.#identifier);
    }

    getExtension() {
        return this.#extension;
    }

    getType() {
        throw new Error('[Canopy] getType() must be implemented.');
    }

    getDefaultValue() {
        return this.#defaultValue;
    }

    resetToDefaultValue() {
        this.setValue(this.#defaultValue);
    }

    async getValue() {
        if (this.#extension)
            return this.#parseRuleValueString(await this.#extension.getRuleValue(this.#identifier));
        return this.#parseRuleValueString(world.getDynamicProperty(this.#identifier));
    }

    getNativeValue() {
        if (this.#extension)
            throw new Error(`[Canopy] [Rule] Native value is not available for ${this.#identifier} from extension ${this.#extension.getName()}.`);
        return this.#parseRuleValueString(world.getDynamicProperty(this.#identifier));
    }

    setValue(value) {
        if (!this.isInDomain(value))
            throw new Error(`[Canopy] Incorrect value type for rule: ${this.getID()}`);
        if (!this.isInRange(value))
            throw new Error(`[Canopy] Value out of range for rule: ${this.getID()}`);
        if (this.#extension) {
            this.#extension.setRuleValue(this.#identifier, value);
        } else {
            world.setDynamicProperty(this.#identifier, value);
            this.onModify(value);
        }
    }

    isInDomain() {
        throw new Error('[Canopy] isInDomain() must be implemented.');
    }

    isInRange() {
        throw new Error('[Canopy] isInRange() must be implemented.');
    }

    #parseDescription(description) {
        if (typeof description == 'string')
            return { text: description };
        return description;
    }
    
    #parseRuleValueString(value) {
        if (value === 'undefined' || value === void 0) {
            this.resetToDefaultValue();
            return this.getDefaultValue();
        }
        try {
            return JSON.parse(value);
        } catch {
            if (value === 'NaN')
                return NaN;
            throw new Error(`Failed to parse value for DynamicProperty: ${value}.`);
        }
    }
}