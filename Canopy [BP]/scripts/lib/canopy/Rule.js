import { world } from '@minecraft/server';
import IPC from "../ipc/ipc";
import { Rules } from "./Rules";
import { Extensions } from './Extensions';

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
        if (this.#extension) {
            // console.warn(`[Canopy] [Rule] Attempting to get value for ${this.#identifier} from extension ${this.#extensionName}.`);
            return await IPC.invoke(`canopyExtension:${this.#extension.getID()}:ruleValueRequest`, { ruleID: this.#identifier }).then(result => 
                // console.warn(`[Canopy] [Rule] Received value for ${this.#identifier} from extension ${this.#extensionName}: ${result}`);
                this.parseValue(result)
            );
        }
        return this.parseValue(world.getDynamicProperty(this.#identifier));
    }

    getNativeValue() {
        if (this.#extension)
            throw new Error(`[Canopy] [Rule] Native value is not available for ${this.#identifier} from extension ${this.#extension.getName()}.`);
        return this.parseValue(world.getDynamicProperty(this.#identifier));
    }
    
    setValue(value) {
        if (this.#extension)
            IPC.send(`canopyExtension:${this.#extension.getID()}:ruleValueSet`, { ruleID: this.#identifier, value: value });
        else
            world.setDynamicProperty(this.#identifier, value);
    }

    parseValue(value) {
        if (value === 'undefined' || value === undefined)
            return undefined;
        try {
            return JSON.parse(value);
        } catch {
            if (value === 'NaN')
                return NaN;
            console.warn(`[Canopy] [Rule] Failed to parse value for ${this.#identifier}: ${value}`);
        }
        return null;
    }
}

export { Rule };