import { world } from '@minecraft/server';
import { Rules } from "./Rules";
import { Extensions } from './Extensions';
import { parseDPValue } from "../../include/utils";

class Rule {
    #category;
    #identifier;
    #description;
    #contingentRules;
    #independentRules;
    #extension;

    constructor({ category, identifier, description = '', contingentRules = [], independentRules = [], extensionName = false }) {
        this.#category = category;
        this.#identifier = identifier;
        if (typeof description == 'string')
            description = { text: description };
        this.#description = description;
        this.#contingentRules = contingentRules;
        this.#independentRules = independentRules;
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
        return parseDPValue(world.getDynamicProperty(this.#identifier));
    }

    getNativeValue() {
        if (this.#extension)
            throw new Error(`[Canopy] [Rule] Native value is not available for ${this.#identifier} from extension ${this.#extension.getName()}.`);
        return parseDPValue(world.getDynamicProperty(this.#identifier));
    }
    
    setValue(value) {
        if (this.#extension)
            this.#extension.setRuleValue(this.#identifier, value);
        else
            world.setDynamicProperty(this.#identifier, value);
    }
}

export { Rule };