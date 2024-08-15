import { world } from '@minecraft/server';

const rules = {};
class Rule {
    #identifier;
    #description;
    #contingentRules;
    #independentRules;

    constructor({ identifier, description = '', contingentRules = [], independentRules = []}) {
        this.#identifier = identifier;
        this.#description = description;
        this.#contingentRules = [];
        this.#independentRules = [];
        rules[this.#identifier] = this;
    }

    getRules() {
        return rules;
    }

    getID() {
        return this.#identifier;
    }

    getDescription() {
        return this.#description;
    }

    getContigentRules() {
        return this.#contingentRules;
    }

    getIndependentRules() {
        return this.#independentRules;
    }

    getValue() {
        return world.getDynamicProperty(this.#identifier);
    }

    static getValue(identifier) {
        // should also check if it is an invalid rule id, but it's fine until all of the rules are in the new format
        return world.getDynamicProperty(identifier);
    }

    static getRule(identifier) {
        return rules[identifier];
    }
}

export default Rule;