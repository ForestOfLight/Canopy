import { world } from "@minecraft/server";

export class Rules {
    static #rules = {};

    static add(rule) {
        this.#rules[rule.getID()] = rule;
    }

    static get(identifier) {
        return this.#rules[identifier];
    }

    static getAll() {
        return Object.values(this.#rules);
    }

    static exists(name) {
        return this.#rules[name] !== undefined;
    }

    static remove(name) {
        delete this.#rules[name];
    }

    static clear() {
        this.#rules = {};
    }
    
    static async getValue(identifier) {
        return await this.get(identifier).getValue();
    }

    static getNativeValue(identifier) {
        return this.get(identifier).parseString(world.getDynamicProperty(identifier));
    }

    static setValue(identifier, value) {
        this.get(identifier).setValue(value);
    }
}

export default Rules;