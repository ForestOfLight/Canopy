class Rules {
    static #rules = {};

    static register(rule) {
        if (this.exists(rule.getID())) 
            throw new Error(`[Canopy] Rule with identifier '${rule.getID()}' already exists.`);
        this.#rules[rule.getID()] = rule;
    }

    static get(identifier) {
        return this.#rules[identifier];
    }

    static getAll() {
        return Object.values(this.#rules);
    }

    static getIDs() {
        return Object.keys(this.#rules);
    }

    static exists(identifier) {
        return this.#rules[identifier] !== undefined;
    }

    static remove(identifier) {
        delete this.#rules[identifier];
    }

    static clear() {
        this.#rules = {};
    }
    
    static async getValue(identifier) {
        const rule = this.get(identifier);
        if (!rule)
            throw new Error(`[Canopy] Rule with identifier '${identifier}' does not exist.`);
        return await rule.getValue();
    }

    static getNativeValue(identifier) {
        const rule = this.get(identifier);
        if (!rule)
            throw new Error(`[Canopy] Rule with identifier '${identifier}' does not exist.`);
        return rule.getNativeValue();
    }

    static setValue(identifier, value) {
        const rule = this.get(identifier)
        if (!rule)
            throw new Error(`[Canopy] Rule with identifier '${identifier}' does not exist.`);
        rule.setValue(value);
    }

    static getDependentRuleIDs(identifier) {
        const rule = this.get(identifier);
        if (!rule)
            throw new Error(`[Canopy] Rule with identifier '${identifier}' does not exist.`);
        return Rules.getAll().filter(r => r.getContigentRuleIDs().includes(identifier)).map(r => r.getID());
    }

    static getByCategory(category) {
        return this.getAll().filter(rule => rule.getCategory() === category);
    }
}

export { Rules };