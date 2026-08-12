import { BooleanRule } from './BooleanRule';
import { Rules } from './Rules';

class InfoDisplayRule extends BooleanRule {
    globalContingentRules;
    #playerElements = {};

    constructor(options) {
        options.category = "InfoDisplay";
        super({ ...options });
        this.globalContingentRules = options.globalContingentRules || [];
    }

    getGlobalContingentRuleIDs() {
        return this.globalContingentRules;
    }

    setPlayerElement(playerId, element) {
        this.#playerElements[playerId] = element;
    }

    getPlayerElement(playerId) {
        return this.#playerElements[playerId];
    }

    removePlayerElement(playerId) {
        delete this.#playerElements[playerId];
    }

    getValue(player) {
        return player.getDynamicProperty(super.getID());
    }

    setValue(player, value) {
        player.setDynamicProperty(super.getID(), value);
        this.onModifyBoolForPlayer(player, value);
    }

    onModifyBoolForPlayer(player, value) {
        const element = this.#playerElements[player.id];
        if (!element) {
            this.onModifyBool(value);
            return;
        }
        if (value === true)
            element.onEnable();
        else if (value === false)
            element.onDisable();
        else
            throw new Error(`[Canopy] Unexpected modification value encountered for rule ${this.getID()}: ${value}`);
    }

    static get(identifier) {
        const rule = Rules.get(identifier);
        if (rule?.getCategory() === "InfoDisplay")
            return rule;
        return undefined;
    }

    static exists(identifier) {
        return Rules.exists(identifier) && Rules.get(identifier).getCategory() === "InfoDisplay";
    }

    static getValue(player, identifier) {
        return this.get(identifier).getValue(player);
    }
    
    static setValue(player, identifier, value) {
        this.get(identifier).setValue(player, value);
    }
    
    static getAll() {
        return Object.values(Rules.getAll()).filter(rule => rule.getCategory() === "InfoDisplay");
    }
}

export { InfoDisplayRule };