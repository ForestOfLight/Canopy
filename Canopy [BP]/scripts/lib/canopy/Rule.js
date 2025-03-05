import { world } from '@minecraft/server';
import { Rules } from "./Rules";
import { Extensions } from './Extensions';

class Rule {
    #category;
    #identifier;
    #description;
    #contingentRules;
    #independentRules;
    #onEnableCallback;
    #onDisableCallback;
    #extension;

    constructor({ category, identifier, description = '', contingentRules = [], independentRules = [], 
                onEnableCallback = null, onDisableCallback = null, extensionName = false }) {
        this.#category = category;
        this.#identifier = identifier;
        if (typeof description == 'string')
            description = { text: description };
        this.#description = description;
        this.#contingentRules = contingentRules;
        this.#independentRules = independentRules;
        this.#onEnableCallback = onEnableCallback;
        this.#onDisableCallback = onDisableCallback;
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

    async getValue() {
        if (this.#extension)
            return await this.#extension.getRuleValue(this.#identifier);
        return this.#parseRuleValueString(world.getDynamicProperty(this.#identifier));
    }

    getNativeValue() {
        if (this.#extension)
            throw new Error(`[Canopy] [Rule] Native value is not available for ${this.#identifier} from extension ${this.#extension.getName()}.`);
        return this.#parseRuleValueString(world.getDynamicProperty(this.#identifier));
    }
    
    setValue(value) {
        if (this.#extension) {
            this.#extension.setRuleValue(this.#identifier, value);
        } else {
            if (value === true)
                this.onEnable();
            else if (value === false)
                this.onDisable();
            world.setDynamicProperty(this.#identifier, value);
        }
    }

    onEnable() {
        if (this.#onEnableCallback)
            this.#onEnableCallback();
    }

    onDisable() {
        if (this.#onDisableCallback)
            this.#onDisableCallback();
    }

    #parseRuleValueString(value) {
        if (value === 'undefined' || value === undefined)
            return undefined;
        try {
            return JSON.parse(value);
        } catch {
            if (value === 'NaN')
                return NaN;
            throw new Error(`Failed to parse value for DynamicProperty: ${value}.`);
        }
    }
}

export { Rule };