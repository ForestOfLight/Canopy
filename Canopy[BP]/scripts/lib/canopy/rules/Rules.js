import { world } from "@minecraft/server";

class Rules {
    static #rules = {};
    static rulesToRegister = [];
    static worldLoaded = false;

    static async register(rule) {
        const ruleID = rule.getID();
        if (this.worldLoaded) {
            if (this.exists(ruleID)) 
                throw new Error(`[Canopy] Rule with identifier '${ruleID}' already exists.`);
            this.#rules[ruleID] = rule;
            if (rule.getCategory() === "Rules") {
                await Promise.resolve();
                const value = await rule.getValue();
                if (value === void 0)
                    rule.resetToDefaultValue();
                else
                    rule.onModify(value);
            }
        } else {
            const alreadyQueued = this.rulesToRegister.some(queuedRule => queuedRule.getID() === ruleID);
            if (alreadyQueued || this.exists(ruleID))
                return;
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
        return Rules.getAll().filter(r => r.getContingentRuleIDs().includes(identifier)).map(r => r.getID());
    }

    static getByCategory(category) {
        return this.getAll().filter(rule => rule.getCategory() === category);
    }

    static getRuleIDsByCategory(category) {
        const registered = this.getByCategory(category);
        const queued = this.rulesToRegister.filter(rule => rule.getCategory() === category);
        const ids = new Set([...registered, ...queued].map(rule => rule.getID()));
        return [...ids];
    }

    static getSettableRuleIDs() {
        return this.getRuleIDsByCategory("Rules");
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