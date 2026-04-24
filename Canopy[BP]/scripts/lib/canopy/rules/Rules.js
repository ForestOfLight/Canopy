import { world } from "@minecraft/server";

class Rules {
    static #rules = {};
    static rulesToRegister = [];
    static worldLoaded = false;

    static async register(rule) {
        if (this.worldLoaded) {
            if (this.exists(rule.getID())) 
                throw new Error(`[Canopy] Rule with identifier '${rule.getID()}' already exists.`);
            this.#rules[rule.getID()] = rule;
            if (rule.getCategory() === "Rules") {
                const value = await rule.getValue();
                if (value === void 0)
                    rule.resetToDefaultValue();
                else
                    rule.onModify(value);
            }
        } else {
            this.rulesToRegister.push(rule);
        }
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

    static registerQueuedRules() {
        for (const rule of this.rulesToRegister)
            this.register(rule);
        this.rulesToRegister = [];
    }
}

world.afterEvents.worldLoad.subscribe(() => {
    Rules.worldLoaded = true;
    Rules.registerQueuedRules();
});

export { Rules };