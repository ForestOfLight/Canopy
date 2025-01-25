import { world } from '@minecraft/server';
import IPC from "../ipc/ipc";
import Rules from "./Rules";

export class Rule {
    #category;
    #identifier;
    #description;
    #contingentRules;
    #independentRules;
    #extensionName;

    constructor({ category, identifier, description = '', contingentRules = [], independentRules = [], extensionName = false }) {
        this.#category = category;
        this.#identifier = identifier;
        this.#description = description;
        this.#contingentRules = contingentRules;
        this.#independentRules = independentRules;
        this.#extensionName = extensionName;
        if (Rules.exists(identifier)) {
            throw new Error(`Rule with identifier '${identifier}' already exists.`);
        }
        Rules.add(this);
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

    getExtensionName() {
        return this.#extensionName;
    }

    async getValue() {
        if (this.#extensionName) {
            // console.warn(`[Canopy] [Rule] Attempting to get value for ${this.#identifier} from extension ${this.#extensionName}.`);
            return await IPC.invoke(`canopyExtension:${this.#extensionName}:ruleValueRequest`, { ruleID: this.#identifier }).then(result => {
                // console.warn(`[Canopy] [Rule] Received value for ${this.#identifier} from extension ${this.#extensionName}: ${result}`);
                return result;
            });
        }
        return this.parseString(world.getDynamicProperty(this.#identifier));
    }

    parseString(value) {
        try {
            return JSON.parse(value);
        } catch (error) {
            if (value === 'undefined') return undefined;
            if (value === 'NaN') return NaN;
        }
        return null;
    }
    
    setValue(value) {
        if (this.#extensionName) {
            IPC.send(`canopyExtension:${this.#extensionName}:ruleValueSet`, { extensionName: this.#extensionName, ruleID: this.#identifier, value: value });
        } else {
            world.setDynamicProperty(this.#identifier, value);
        }
    }

    getDependentRuleIDs() {
        return Rules.getAll().filter(rule => rule.#contingentRules.includes(this.#identifier)).map(rule => rule.#identifier);
    }
}

export default Rule;