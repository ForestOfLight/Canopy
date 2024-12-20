import { world, system } from '@minecraft/server';

const rules = {};

class Rule {
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
        if (Rule.exists(identifier)) {
            throw new Error(`Rule with identifier '${identifier}' already exists.`);
        } rules[identifier] = this;
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
            try {
                world.getDimension('overworld').runCommandAsync(`scriptevent canopyExtension:ruleValueRequest ${this.#extensionName} ${this.#identifier}`);
                const result = await new Promise((resolve, reject) => {
                    system.afterEvents.scriptEventReceive.subscribe((event) => this.recieveRuleValue(event, resolve), { namespaces: ['canopyExtension'] });
                });
                return this.parseString(result);
            } catch (error) {
                throw new Error(`[Canopy] [Rule] Error getting value for ${this.#identifier}: ${error}`);
            }
        }
        return this.parseString(world.getDynamicProperty(this.#identifier));
    }
    
    async recieveRuleValue(scriptEventReceive, resolve) {
        if (scriptEventReceive.id !== 'canopyExtension:ruleValueResponse' || scriptEventReceive.sourceType !== 'Server') return;
        const splitMessage = scriptEventReceive.message.split(' ');
        const extensionName = splitMessage[0];
        if (extensionName !== this.#extensionName) return;
        const ruleID = splitMessage[1];
        if (ruleID !== this.#identifier) return;
        const value = splitMessage[2];
        // console.warn(`[Canopy] Received rule value: ${extensionName}:${ruleID} ${value}`);
        resolve(value);
    }

    parseString(value) {
        try {
            return JSON.parse(value);
        } catch (error) {
            if (value === 'undefined') return undefined;
            if (value === 'NaN') return NaN;
        }
    }
    
    setValue(value) {
        if (this.#extensionName) {
            world.getDimension('overworld').runCommandAsync(`scriptevent canopyExtension:ruleValueSet ${this.#extensionName} ${this.#identifier} ${value}`);
        } else {
            world.setDynamicProperty(this.#identifier, value);
        }
    }

    getDependentRuleIDs() {
        return Object.values(rules).filter(rule => rule.#contingentRules.includes(this.#identifier)).map(rule => rule.#identifier);
    }

    static exists(identifier) {
        return rules[identifier] !== undefined;
    }
    
    static async getValue(identifier) {
        return await Rule.getRule(identifier).getValue();
    }

    static getNativeValue(identifier) {
        return Rule.getRule(identifier).parseString(world.getDynamicProperty(identifier));
    }

    static setValue(identifier, value) {
        Rule.getRule(identifier).setValue(value);
    }

    static getRules() {
        return rules;
    }

    static getCategories() {
        return [...new Set(Object.values(rules).map(rule => rule.#category))];
    }

    static getRulesByCategory(category) {
        let result = Object.values(rules).filter(rule => rule.#category === category);
        result.sort((a, b) => a.#identifier.localeCompare(b.#identifier));
        return result;
    }

    static getRulesByExtension(extensionName) {
        return Object.values(rules).filter(rule => rule.#extensionName === extensionName);
    }

    static getRule(identifier) {
        return rules[identifier];
    }

    static getExtensionNames() {
        return [...new Set(Object.values(rules).map(rule => rule.#extensionName))].filter(name => name !== false);
    }
}

export default Rule;